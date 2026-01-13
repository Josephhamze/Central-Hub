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
exports.CrusherOutputEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let CrusherOutputEntriesService = class CrusherOutputEntriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateYieldPercentage(date, shift, crusherId, outputTonnage) {
        const feedEntries = await this.prisma.crusherFeedEntry.findMany({
            where: {
                date,
                shift,
                crusherId,
                status: client_1.EntryStatus.APPROVED,
            },
        });
        if (feedEntries.length === 0) {
            return null;
        }
        const totalFeedTonnage = feedEntries.reduce((sum, entry) => sum.plus(entry.weighBridgeTonnage), new library_1.Decimal(0));
        if (totalFeedTonnage.isZero()) {
            return null;
        }
        return outputTonnage.dividedBy(totalFeedTonnage).times(100);
    }
    async findAll(page = 1, limit = 20, dateFrom, dateTo, shift, crusherId, productTypeId, status) {
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
        if (crusherId)
            where.crusherId = crusherId;
        if (productTypeId)
            where.productTypeId = productTypeId;
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.crusherOutputEntry.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    crusher: { select: { id: true, name: true, type: true } },
                    productType: { select: { id: true, name: true } },
                    stockpileLocation: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    approver: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ date: 'desc' }, { shift: 'desc' }],
            }),
            this.prisma.crusherOutputEntry.count({ where }),
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
        const entry = await this.prisma.crusherOutputEntry.findUnique({
            where: { id },
            include: {
                crusher: true,
                productType: true,
                stockpileLocation: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Crusher output entry not found');
        }
        return entry;
    }
    async create(dto, createdById) {
        const [crusher, productType, stockpileLocation] = await Promise.all([
            this.prisma.crusher.findUnique({ where: { id: dto.crusherId } }),
            this.prisma.productType.findUnique({ where: { id: dto.productTypeId } }),
            this.prisma.stockpileLocation.findUnique({ where: { id: dto.stockpileLocationId } }),
        ]);
        if (!crusher)
            throw new common_1.NotFoundException('Crusher not found');
        if (!productType)
            throw new common_1.NotFoundException('Product type not found');
        if (!stockpileLocation)
            throw new common_1.NotFoundException('Stockpile location not found');
        const date = new Date(dto.date);
        const outputTonnage = new library_1.Decimal(dto.outputTonnage);
        const yieldPercentage = await this.calculateYieldPercentage(date, dto.shift, dto.crusherId, outputTonnage);
        return this.prisma.crusherOutputEntry.create({
            data: {
                date,
                shift: dto.shift,
                crusherId: dto.crusherId,
                productTypeId: dto.productTypeId,
                stockpileLocationId: dto.stockpileLocationId,
                outputTonnage,
                yieldPercentage,
                qualityGrade: dto.qualityGrade,
                moisturePercentage: dto.moisturePercentage ? new library_1.Decimal(dto.moisturePercentage) : null,
                notes: dto.notes,
                status: client_1.EntryStatus.PENDING,
                createdById,
            },
            include: {
                crusher: true,
                productType: true,
                stockpileLocation: true,
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
        let yieldPercentage = entry.yieldPercentage;
        const date = dto.date ? new Date(dto.date) : entry.date;
        const shift = dto.shift || entry.shift;
        const crusherId = dto.crusherId || entry.crusherId;
        const outputTonnage = dto.outputTonnage ? new library_1.Decimal(dto.outputTonnage) : entry.outputTonnage;
        if (dto.outputTonnage || dto.date || dto.shift || dto.crusherId) {
            yieldPercentage = await this.calculateYieldPercentage(date, shift, crusherId, outputTonnage);
        }
        return this.prisma.crusherOutputEntry.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                outputTonnage: dto.outputTonnage ? new library_1.Decimal(dto.outputTonnage) : undefined,
                yieldPercentage,
                moisturePercentage: dto.moisturePercentage !== undefined ? (dto.moisturePercentage ? new library_1.Decimal(dto.moisturePercentage) : null) : undefined,
            },
            include: {
                crusher: true,
                productType: true,
                stockpileLocation: true,
            },
        });
    }
    async approve(id, approverId, notes) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve entry with status ${entry.status}`);
        }
        return this.prisma.crusherOutputEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.APPROVED,
                approverId,
                approvedAt: new Date(),
            },
            include: {
                crusher: true,
                productType: true,
                stockpileLocation: true,
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async reject(id, approverId, reason) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject entry with status ${entry.status}`);
        }
        return this.prisma.crusherOutputEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.REJECTED,
                approverId,
                approvedAt: new Date(),
                notes: entry.notes ? `${entry.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
            },
            include: {
                crusher: true,
                productType: true,
                stockpileLocation: true,
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
        return this.prisma.crusherOutputEntry.delete({
            where: { id },
        });
    }
};
exports.CrusherOutputEntriesService = CrusherOutputEntriesService;
exports.CrusherOutputEntriesService = CrusherOutputEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrusherOutputEntriesService);
//# sourceMappingURL=crusher-output-entries.service.js.map