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
exports.CrusherFeedEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let CrusherFeedEntriesService = class CrusherFeedEntriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateFeedRate(weighBridgeTonnage, feedStartTime, feedEndTime) {
        const operatingHours = (feedEndTime.getTime() - feedStartTime.getTime()) / (1000 * 60 * 60);
        if (operatingHours <= 0) {
            return null;
        }
        return weighBridgeTonnage.dividedBy(new library_1.Decimal(operatingHours));
    }
    async findAll(page = 1, limit = 20, dateFrom, dateTo, shift, crusherId, status) {
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
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.crusherFeedEntry.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    crusher: { select: { id: true, name: true, type: true, ratedCapacity: true } },
                    materialType: { select: { id: true, name: true, density: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    approver: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ date: 'desc' }, { shift: 'desc' }],
            }),
            this.prisma.crusherFeedEntry.count({ where }),
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
        const entry = await this.prisma.crusherFeedEntry.findUnique({
            where: { id },
            include: {
                crusher: true,
                materialType: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Crusher feed entry not found');
        }
        return entry;
    }
    async create(dto, createdById) {
        const [crusher, materialType] = await Promise.all([
            this.prisma.crusher.findUnique({ where: { id: dto.crusherId } }),
            this.prisma.materialType.findUnique({ where: { id: dto.materialTypeId } }),
        ]);
        if (!crusher)
            throw new common_1.NotFoundException('Crusher not found');
        if (!materialType)
            throw new common_1.NotFoundException('Material type not found');
        const feedStartTime = new Date(dto.feedStartTime);
        const feedEndTime = new Date(dto.feedEndTime);
        if (feedEndTime <= feedStartTime) {
            throw new common_1.BadRequestException('Feed end time must be after feed start time');
        }
        const existing = await this.prisma.crusherFeedEntry.findUnique({
            where: {
                date_shift_crusherId: {
                    date: new Date(dto.date),
                    shift: dto.shift,
                    crusherId: dto.crusherId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Entry already exists for this date, shift, and crusher combination');
        }
        const weighBridgeTonnage = new library_1.Decimal(dto.weighBridgeTonnage);
        const feedRate = this.calculateFeedRate(weighBridgeTonnage, feedStartTime, feedEndTime);
        return this.prisma.crusherFeedEntry.create({
            data: {
                date: new Date(dto.date),
                shift: dto.shift,
                crusherId: dto.crusherId,
                materialTypeId: dto.materialTypeId,
                feedStartTime,
                feedEndTime,
                truckLoadsReceived: dto.truckLoadsReceived,
                weighBridgeTonnage,
                feedRate,
                rejectOversizeTonnage: dto.rejectOversizeTonnage ? new library_1.Decimal(dto.rejectOversizeTonnage) : null,
                notes: dto.notes,
                status: client_1.EntryStatus.PENDING,
                createdById,
            },
            include: {
                crusher: true,
                materialType: true,
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
        let feedRate = entry.feedRate;
        const feedStartTime = dto.feedStartTime ? new Date(dto.feedStartTime) : entry.feedStartTime;
        const feedEndTime = dto.feedEndTime ? new Date(dto.feedEndTime) : entry.feedEndTime;
        const weighBridgeTonnage = dto.weighBridgeTonnage ? new library_1.Decimal(dto.weighBridgeTonnage) : entry.weighBridgeTonnage;
        if (dto.feedStartTime || dto.feedEndTime || dto.weighBridgeTonnage) {
            if (feedEndTime <= feedStartTime) {
                throw new common_1.BadRequestException('Feed end time must be after feed start time');
            }
            feedRate = this.calculateFeedRate(weighBridgeTonnage, feedStartTime, feedEndTime);
        }
        return this.prisma.crusherFeedEntry.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                feedStartTime: dto.feedStartTime ? new Date(dto.feedStartTime) : undefined,
                feedEndTime: dto.feedEndTime ? new Date(dto.feedEndTime) : undefined,
                weighBridgeTonnage: dto.weighBridgeTonnage ? new library_1.Decimal(dto.weighBridgeTonnage) : undefined,
                feedRate,
                rejectOversizeTonnage: dto.rejectOversizeTonnage !== undefined ? (dto.rejectOversizeTonnage ? new library_1.Decimal(dto.rejectOversizeTonnage) : null) : undefined,
            },
            include: {
                crusher: true,
                materialType: true,
            },
        });
    }
    async approve(id, approverId, notes) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve entry with status ${entry.status}`);
        }
        return this.prisma.crusherFeedEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.APPROVED,
                approverId,
                approvedAt: new Date(),
            },
            include: {
                crusher: true,
                materialType: true,
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async reject(id, approverId, reason) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject entry with status ${entry.status}`);
        }
        return this.prisma.crusherFeedEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.REJECTED,
                approverId,
                approvedAt: new Date(),
                notes: entry.notes ? `${entry.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
            },
            include: {
                crusher: true,
                materialType: true,
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
        return this.prisma.crusherFeedEntry.delete({
            where: { id },
        });
    }
};
exports.CrusherFeedEntriesService = CrusherFeedEntriesService;
exports.CrusherFeedEntriesService = CrusherFeedEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrusherFeedEntriesService);
//# sourceMappingURL=crusher-feed-entries.service.js.map