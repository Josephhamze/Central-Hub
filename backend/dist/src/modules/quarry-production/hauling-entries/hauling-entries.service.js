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
exports.HaulingEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let HaulingEntriesService = class HaulingEntriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateTotalHauled(tripCount, loadCapacity) {
        return new library_1.Decimal(tripCount).times(loadCapacity);
    }
    async findAll(page = 1, limit = 20, dateFrom, dateTo, shift, truckId, driverId, status) {
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
        if (truckId)
            where.truckId = truckId;
        if (driverId)
            where.driverId = driverId;
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.haulingEntry.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    truck: { select: { id: true, name: true, loadCapacity: true } },
                    driver: { select: { id: true, firstName: true, lastName: true, email: true } },
                    sourceExcavatorEntry: {
                        select: {
                            id: true,
                            date: true,
                            shift: true,
                            estimatedTonnage: true,
                        },
                    },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    approver: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ date: 'desc' }, { shift: 'desc' }],
            }),
            this.prisma.haulingEntry.count({ where }),
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
        const entry = await this.prisma.haulingEntry.findUnique({
            where: { id },
            include: {
                truck: true,
                driver: { select: { id: true, firstName: true, lastName: true, email: true } },
                sourceExcavatorEntry: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Hauling entry not found');
        }
        return entry;
    }
    async create(dto, createdById) {
        const truck = await this.prisma.truck.findUnique({
            where: { id: dto.truckId },
        });
        if (!truck)
            throw new common_1.NotFoundException('Truck not found');
        const existing = await this.prisma.haulingEntry.findUnique({
            where: {
                date_shift_truckId_driverId: {
                    date: new Date(dto.date),
                    shift: dto.shift,
                    truckId: dto.truckId,
                    driverId: dto.driverId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Entry already exists for this date, shift, truck, and driver combination');
        }
        const totalHauled = this.calculateTotalHauled(dto.tripCount, truck.loadCapacity);
        return this.prisma.haulingEntry.create({
            data: {
                date: new Date(dto.date),
                shift: dto.shift,
                truckId: dto.truckId,
                driverId: dto.driverId,
                excavatorEntryId: dto.excavatorEntryId || null,
                tripCount: dto.tripCount,
                totalHauled: totalHauled,
                avgCycleTime: dto.avgCycleTime ? new library_1.Decimal(dto.avgCycleTime) : null,
                fuelConsumption: dto.fuelConsumption ? new library_1.Decimal(dto.fuelConsumption) : null,
                notes: dto.notes,
                status: client_1.EntryStatus.PENDING,
                createdById,
            },
            include: {
                truck: true,
                driver: { select: { id: true, firstName: true, lastName: true } },
                sourceExcavatorEntry: true,
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
        let totalHauled = entry.totalHauled;
        if (dto.tripCount || dto.truckId) {
            const truckId = dto.truckId || entry.truckId;
            const tripCount = dto.tripCount || entry.tripCount;
            const truck = await this.prisma.truck.findUnique({
                where: { id: truckId },
            });
            if (!truck)
                throw new common_1.NotFoundException('Truck not found');
            totalHauled = this.calculateTotalHauled(tripCount, truck.loadCapacity);
        }
        const updateData = {};
        if (dto.date !== undefined) {
            updateData.date = new Date(dto.date);
        }
        if (dto.shift !== undefined) {
            updateData.shift = dto.shift;
        }
        if (dto.truckId !== undefined) {
            updateData.truckId = dto.truckId;
        }
        if (dto.driverId !== undefined) {
            updateData.driverId = dto.driverId;
        }
        if (dto.excavatorEntryId !== undefined) {
            updateData.excavatorEntryId = dto.excavatorEntryId || null;
        }
        if (dto.tripCount !== undefined) {
            updateData.tripCount = dto.tripCount;
        }
        if (dto.avgCycleTime !== undefined) {
            updateData.avgCycleTime = dto.avgCycleTime ? new library_1.Decimal(dto.avgCycleTime) : null;
        }
        if (dto.fuelConsumption !== undefined) {
            updateData.fuelConsumption = dto.fuelConsumption ? new library_1.Decimal(dto.fuelConsumption) : null;
        }
        if (dto.notes !== undefined) {
            updateData.notes = dto.notes;
        }
        if (totalHauled !== undefined) {
            updateData.totalHauled = totalHauled;
        }
        return this.prisma.haulingEntry.update({
            where: { id },
            data: updateData,
            include: {
                truck: true,
                driver: { select: { id: true, firstName: true, lastName: true } },
                sourceExcavatorEntry: true,
            },
        });
    }
    async approve(id, approverId, notes) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve entry with status ${entry.status}`);
        }
        return this.prisma.haulingEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.APPROVED,
                approverId,
                approvedAt: new Date(),
            },
            include: {
                truck: true,
                driver: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async reject(id, approverId, reason) {
        const entry = await this.findOne(id);
        if (entry.status !== client_1.EntryStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject entry with status ${entry.status}`);
        }
        return this.prisma.haulingEntry.update({
            where: { id },
            data: {
                status: client_1.EntryStatus.REJECTED,
                approverId,
                approvedAt: new Date(),
                notes: entry.notes ? `${entry.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
            },
            include: {
                truck: true,
                driver: { select: { id: true, firstName: true, lastName: true } },
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
        return this.prisma.haulingEntry.delete({
            where: { id },
        });
    }
};
exports.HaulingEntriesService = HaulingEntriesService;
exports.HaulingEntriesService = HaulingEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HaulingEntriesService);
//# sourceMappingURL=hauling-entries.service.js.map