"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcavatorEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let ExcavatorEntriesService = class ExcavatorEntriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateEstimates(bucketCount, bucketCapacity, materialDensity) {
        const estimatedVolume = new library_1.Decimal(bucketCount).times(bucketCapacity);
        const estimatedTonnage = estimatedVolume.times(materialDensity);
        return { estimatedVolume, estimatedTonnage };
    }
    async findAll(page = 1, limit = 20, dateFrom, dateTo, shift, excavatorId, operatorId, status) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom)
                where.date.gte = new Date(dateFrom);
            if (dateTo)
                where.date.lte = new Date(dateTo);
        }
        if (shift)
            where.shift = shift;
        if (excavatorId)
            where.excavatorId = excavatorId;
        if (operatorId)
            where.operatorId = operatorId;
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.excavatorEntry.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    excavator: { select: { id: true, name: true, bucketCapacity: true } },
                    operator: { select: { id: true, firstName: true, lastName: true, email: true } },
                    materialType: { select: { id: true, name: true, density: true } },
                    pitLocation: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    approver: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ date: 'desc' }, { shift: 'desc' }],
            }),
            this.prisma.excavatorEntry.count({ where }),
        ]);
        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }
    async findOne(id) {
        const entry = await this.prisma.excavatorEntry.findUnique({
            where: { id },
            include: {
                excavator: true,
                operator: { select: { id: true, firstName: true, lastName: true, email: true } },
                materialType: true,
                pitLocation: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Excavator entry not found');
        }
        return entry;
    }
    async create(dto, createdById) {
        const [excavator, materialType] = await Promise.all([
            this.prisma.excavator.findUnique({ where: { id: dto.excavatorId } }),
            this.prisma.materialType.findUnique({ where: { id: dto.materialTypeId } }),
        ]);
        if (!excavator)
            throw new common_1.NotFoundException('Excavator not found');
        if (!materialType)
            throw new common_1.NotFoundException('Material type not found');
        const existing = await this.prisma.excavatorEntry.findUnique({
            where: {
                date_shift_excavatorId_operatorId: {
                    date: new Date(dto.date),
                    shift: dto.shift,
                    excavatorId: dto.excavatorId,
                    operatorId: dto.operatorId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Entry already exists for this date, shift, excavator, and operator combination');
        }
        const { estimatedVolume, estimatedTonnage } = this.calculateEstimates(dto.bucketCount, excavator.bucketCapacity, materialType.density);
        return this.prisma.excavatorEntry.create({
            data: {
                date: new Date(dto.date),
                shift: dto.shift,
                excavatorId: dto.excavatorId,
                operatorId: dto.operatorId,
                materialTypeId: dto.materialTypeId,
                pitLocationId: dto.pitLocationId,
                bucketCount: dto.bucketCount,
                estimatedVolume,
                estimatedTonnage,
                downtimeHours: dto.downtimeHours ? new library_1.Decimal(dto.downtimeHours) : null,
                notes: dto.notes,
                status: client_1.EntryStatus.PENDING,
                createdById,
            },
            include: {
                excavator: true,
                operator: { select: { id: true, firstName: true, lastName: true } },
                materialType: true,
                pitLocation: true,
            },
        });
    }
    async update(id, dto, userId) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING && entry.status !== client_1.EntryStatus.REJECTED) {
            throw new common_1.BadRequestException('Can only update PENDING or REJECTED entries');
        }
        if (entry.createdById !== userId) {
            throw new common_1.ForbiddenException('You can only update entries you created');
        }
        let estimatedVolume = entry.estimatedVolume;
        let estimatedTonnage = entry.estimatedTonnage;
        if (dto.bucketCount || dto.excavatorId || dto.materialTypeId) {
            const excavatorId = dto.excavatorId || entry.excavatorId;
            const materialTypeId = dto.materialTypeId || entry.materialTypeId;
            const bucketCount = dto.bucketCount || entry.bucketCount;
            const [excavator, materialType] = await Promise.all([
                this.prisma.excavator.findUnique({ where: { id: excavatorId } }),
                this.prisma.materialType.findUnique({ where: { id: materialTypeId } }),
            ]);
            if (!excavator)
                throw new common_1.NotFoundException('Excavator not found');
            if (!materialType)
                throw new common_1.NotFoundException('Material type not found');
            const calculations = this.calculateEstimates(bucketCount, excavator.bucketCapacity, materialType.density);
            estimatedVolume = calculations.estimatedVolume;
            estimatedTonnage = calculations.estimatedTonnage;
        }
        return this.prisma.excavatorEntry.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                estimatedVolume,
                estimatedTonnage,
                downtimeHours: dto.downtimeHours !== undefined ? (dto.downtimeHours ? new library_1.Decimal(dto.downtimeHours) : null) : undefined,
            },
            include: {
                excavator: true,
                operator: { select: { id: true, firstName: true, lastName: true } },
                materialType: true,
                pitLocation: true,
            },
        });
    }
    async approve(id, approverId, notes) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve entry with status ${entry.status}`);
        }
        return this.prisma.excavatorEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.APPROVED,
                approverId,
                approvedAt: new Date(),
            },
            include: {
                excavator: true,
                operator: { select: { id: true, firstName: true, lastName: true } },
                materialType: true,
                pitLocation: true,
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async reject(id, approverId, reason) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject entry with status ${entry.status}`);
        }
        return this.prisma.excavatorEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.REJECTED,
                approverId,
                approvedAt: new Date(),
                notes: entry.notes ? `${entry.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
            },
            include: {
                excavator: true,
                operator: { select: { id: true, firstName: true, lastName: true } },
                materialType: true,
                pitLocation: true,
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async remove(id, userId) {
        const entry = await this.findOne(id);
        if (entry.createdById !== userId) {
            throw new common_1.ForbiddenException('You can only delete entries you created');
        }
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException('Can only delete PENDING entries');
        }
        return this.prisma.excavatorEntry.delete({
            where: { id },
        });
    }
};
exports.ExcavatorEntriesService = ExcavatorEntriesService;
exports.ExcavatorEntriesService = ExcavatorEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExcavatorEntriesService);
//# sourceMappingURL=excavator-entries.service.js.map