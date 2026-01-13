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
exports.MaintenanceSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let MaintenanceSchedulesService = class MaintenanceSchedulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, assetId, isActive) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (assetId)
            where.assetId = assetId;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [items, total] = await Promise.all([
            this.prisma.maintenanceSchedule.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    asset: {
                        select: { id: true, assetTag: true, name: true, status: true },
                    },
                    _count: {
                        select: { workOrders: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.maintenanceSchedule.count({ where }),
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
        const schedule = await this.prisma.maintenanceSchedule.findUnique({
            where: { id },
            include: {
                asset: true,
                workOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Maintenance schedule not found');
        }
        return schedule;
    }
    async create(dto) {
        const asset = await this.prisma.asset.findUnique({
            where: { id: dto.assetId },
        });
        if (!asset) {
            throw new common_1.BadRequestException('Asset not found');
        }
        if (dto.type === client_1.MaintenanceScheduleType.TIME_BASED && !dto.intervalDays) {
            throw new common_1.BadRequestException('intervalDays is required for time-based schedules');
        }
        if (dto.type === client_1.MaintenanceScheduleType.USAGE_BASED && !dto.intervalHours) {
            throw new common_1.BadRequestException('intervalHours is required for usage-based schedules');
        }
        let nextDueAt = null;
        if (dto.type === client_1.MaintenanceScheduleType.TIME_BASED && dto.intervalDays) {
            nextDueAt = new Date();
            nextDueAt.setDate(nextDueAt.getDate() + dto.intervalDays);
        }
        else if (dto.type === client_1.MaintenanceScheduleType.USAGE_BASED && dto.intervalHours) {
            nextDueAt = new Date();
            nextDueAt.setHours(nextDueAt.getHours() + dto.intervalHours);
        }
        const schedule = await this.prisma.maintenanceSchedule.create({
            data: {
                assetId: dto.assetId,
                type: dto.type,
                intervalDays: dto.intervalDays,
                intervalHours: dto.intervalHours,
                checklistJson: dto.checklistJson,
                estimatedDurationHours: dto.estimatedDurationHours,
                requiredPartsJson: dto.requiredPartsJson,
                isActive: dto.isActive ?? true,
                nextDueAt,
            },
            include: {
                asset: {
                    select: { id: true, assetTag: true, name: true },
                },
            },
        });
        return schedule;
    }
    async update(id, dto) {
        const schedule = await this.prisma.maintenanceSchedule.findUnique({
            where: { id },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Maintenance schedule not found');
        }
        let nextDueAt = schedule.nextDueAt;
        if (dto.intervalDays !== undefined || dto.intervalHours !== undefined) {
            if (schedule.type === client_1.MaintenanceScheduleType.TIME_BASED) {
                const intervalDays = dto.intervalDays ?? schedule.intervalDays;
                if (intervalDays) {
                    const baseDate = schedule.lastPerformedAt || new Date();
                    nextDueAt = new Date(baseDate);
                    nextDueAt.setDate(nextDueAt.getDate() + intervalDays);
                }
            }
            else if (schedule.type === client_1.MaintenanceScheduleType.USAGE_BASED) {
                const intervalHours = dto.intervalHours ?? schedule.intervalHours;
                if (intervalHours) {
                    const baseDate = schedule.lastPerformedAt || new Date();
                    nextDueAt = new Date(baseDate);
                    nextDueAt.setHours(nextDueAt.getHours() + intervalHours);
                }
            }
        }
        const updateData = {};
        if (dto.type !== undefined)
            updateData.type = dto.type;
        if (dto.intervalDays !== undefined)
            updateData.intervalDays = dto.intervalDays;
        if (dto.intervalHours !== undefined)
            updateData.intervalHours = dto.intervalHours;
        if (dto.checklistJson !== undefined)
            updateData.checklistJson = dto.checklistJson;
        if (dto.estimatedDurationHours !== undefined)
            updateData.estimatedDurationHours = dto.estimatedDurationHours;
        if (dto.requiredPartsJson !== undefined)
            updateData.requiredPartsJson = dto.requiredPartsJson;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        if (nextDueAt !== schedule.nextDueAt)
            updateData.nextDueAt = nextDueAt;
        const updated = await this.prisma.maintenanceSchedule.update({
            where: { id },
            data: updateData,
            include: {
                asset: {
                    select: { id: true, assetTag: true, name: true },
                },
            },
        });
        return updated;
    }
    async remove(id) {
        const schedule = await this.prisma.maintenanceSchedule.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { workOrders: true },
                },
            },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Maintenance schedule not found');
        }
        if (schedule._count.workOrders > 0) {
            throw new common_1.BadRequestException('Cannot delete schedule with associated work orders');
        }
        await this.prisma.maintenanceSchedule.delete({
            where: { id },
        });
        return { message: 'Maintenance schedule deleted successfully' };
    }
    async getOverdue() {
        try {
            const now = new Date();
            const overdue = await this.prisma.maintenanceSchedule.findMany({
                where: {
                    isActive: true,
                    nextDueAt: {
                        lte: now,
                        not: null,
                    },
                },
                include: {
                    asset: {
                        select: { id: true, assetTag: true, name: true, status: true },
                    },
                },
                orderBy: { nextDueAt: 'asc' },
            });
            return overdue;
        }
        catch (error) {
            console.error('Error in getOverdue:', error);
            return [];
        }
    }
};
exports.MaintenanceSchedulesService = MaintenanceSchedulesService;
exports.MaintenanceSchedulesService = MaintenanceSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceSchedulesService);
//# sourceMappingURL=maintenance-schedules.service.js.map