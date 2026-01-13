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
exports.WorkOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let WorkOrdersService = class WorkOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, status, assetId) {
        try {
            const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
            const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
            const skip = (pageNum - 1) * limitNum;
            const where = {};
            if (status)
                where.status = status;
            if (assetId)
                where.assetId = assetId;
            const [items, total] = await Promise.all([
                this.prisma.workOrder.findMany({
                    where,
                    skip,
                    take: limitNum,
                    include: {
                        asset: {
                            select: { id: true, assetTag: true, name: true, status: true },
                        },
                        schedule: {
                            select: { id: true, type: true },
                        },
                        assignedTo: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                        _count: {
                            select: { partUsages: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.workOrder.count({ where }),
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
        catch (error) {
            console.error('Error in workOrders.findAll:', error);
            return {
                items: [],
                pagination: {
                    page: typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1),
                    limit: typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20),
                    total: 0,
                    totalPages: 0,
                },
            };
        }
    }
    async findOne(id) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id },
            include: {
                asset: true,
                schedule: true,
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                partUsages: {
                    include: {
                        sparePart: {
                            select: { id: true, name: true, sku: true },
                        },
                    },
                },
            },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        return workOrder;
    }
    async create(dto, actorUserId) {
        const asset = await this.prisma.asset.findUnique({
            where: { id: dto.assetId },
        });
        if (!asset) {
            throw new common_1.BadRequestException('Asset not found');
        }
        if (dto.scheduleId) {
            const schedule = await this.prisma.maintenanceSchedule.findUnique({
                where: { id: dto.scheduleId },
            });
            if (!schedule) {
                throw new common_1.BadRequestException('Maintenance schedule not found');
            }
            if (schedule.assetId !== dto.assetId) {
                throw new common_1.BadRequestException('Schedule does not belong to this asset');
            }
        }
        if (dto.assignedToUserId) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.assignedToUserId },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
        }
        const workOrder = await this.prisma.workOrder.create({
            data: {
                assetId: dto.assetId,
                scheduleId: dto.scheduleId,
                type: dto.type,
                priority: dto.priority || 'MEDIUM',
                status: 'OPEN',
                description: dto.description,
                assignedToUserId: dto.assignedToUserId,
                notes: dto.notes,
            },
            include: {
                asset: {
                    select: { id: true, assetTag: true, name: true },
                },
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        await this.prisma.assetHistory.create({
            data: {
                assetId: dto.assetId,
                eventType: 'WORK_ORDER_COMPLETED',
                actorUserId,
                metadataJson: {
                    workOrderId: workOrder.id,
                    type: dto.type,
                    description: dto.description,
                },
            },
        });
        return workOrder;
    }
    async update(id, dto) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot update completed or cancelled work order');
        }
        const updateData = {};
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.priority !== undefined)
            updateData.priority = dto.priority;
        if (dto.assignedToUserId !== undefined)
            updateData.assignedToUserId = dto.assignedToUserId;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data: updateData,
            include: {
                asset: {
                    select: { id: true, assetTag: true, name: true },
                },
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        return updated;
    }
    async start(id, actorUserId) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id },
            include: { asset: true },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (workOrder.status !== 'OPEN') {
            throw new common_1.BadRequestException('Only open work orders can be started');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                },
            });
            if (workOrder.asset.status === 'OPERATIONAL') {
                await tx.asset.update({
                    where: { id: workOrder.assetId },
                    data: { status: 'MAINTENANCE' },
                });
                await tx.assetHistory.create({
                    data: {
                        assetId: workOrder.assetId,
                        eventType: 'STATUS_CHANGED',
                        actorUserId,
                        metadataJson: {
                            oldStatus: 'OPERATIONAL',
                            newStatus: 'MAINTENANCE',
                            reason: 'Work order started',
                        },
                    },
                });
            }
            return wo;
        });
        return updated;
    }
    async complete(id, dto, actorUserId) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id },
            include: {
                asset: true,
                schedule: true,
                partUsages: true,
            },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Work order is already completed or cancelled');
        }
        const partsCost = workOrder.partUsages.reduce((sum, usage) => sum + Number(usage.costSnapshot) * Number(usage.quantityUsed), 0);
        const laborCost = dto.laborCost || 0;
        const totalCost = partsCost + laborCost;
        const completed = await this.prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    downtimeHours: dto.downtimeHours,
                    laborCost,
                    partsCost,
                    totalCost,
                    notes: dto.notes || workOrder.notes,
                },
            });
            if (workOrder.scheduleId) {
                const schedule = await tx.maintenanceSchedule.findUnique({
                    where: { id: workOrder.scheduleId },
                });
                if (schedule) {
                    let nextDueAt = null;
                    if (schedule.type === 'TIME_BASED' && schedule.intervalDays) {
                        nextDueAt = new Date();
                        nextDueAt.setDate(nextDueAt.getDate() + schedule.intervalDays);
                    }
                    else if (schedule.type === 'USAGE_BASED' && schedule.intervalHours) {
                        nextDueAt = new Date();
                        nextDueAt.setHours(nextDueAt.getHours() + schedule.intervalHours);
                    }
                    await tx.maintenanceSchedule.update({
                        where: { id: workOrder.scheduleId },
                        data: {
                            lastPerformedAt: new Date(),
                            nextDueAt,
                        },
                    });
                }
            }
            if (workOrder.asset.status === 'MAINTENANCE' || workOrder.asset.status === 'BROKEN') {
                await tx.asset.update({
                    where: { id: workOrder.assetId },
                    data: { status: 'OPERATIONAL' },
                });
                await tx.assetHistory.create({
                    data: {
                        assetId: workOrder.assetId,
                        eventType: 'STATUS_CHANGED',
                        actorUserId,
                        metadataJson: {
                            oldStatus: workOrder.asset.status,
                            newStatus: 'OPERATIONAL',
                            reason: 'Work order completed',
                        },
                    },
                });
            }
            await tx.assetHistory.create({
                data: {
                    assetId: workOrder.assetId,
                    eventType: 'WORK_ORDER_COMPLETED',
                    actorUserId,
                    metadataJson: {
                        workOrderId: id,
                        type: workOrder.type,
                        totalCost,
                        downtimeHours: dto.downtimeHours,
                    },
                },
            });
            return wo;
        });
        return completed;
    }
    async consumePart(workOrderId, dto, actorUserId) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id: workOrderId },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot consume parts for completed or cancelled work order');
        }
        const sparePart = await this.prisma.sparePart.findUnique({
            where: { id: dto.sparePartId },
        });
        if (!sparePart) {
            throw new common_1.NotFoundException('Spare part not found');
        }
        if (Number(sparePart.quantityOnHand) < dto.quantityUsed) {
            throw new common_1.BadRequestException('Insufficient stock available');
        }
        const consumed = await this.prisma.$transaction(async (tx) => {
            const usage = await tx.partUsage.create({
                data: {
                    workOrderId,
                    sparePartId: dto.sparePartId,
                    quantityUsed: dto.quantityUsed,
                    costSnapshot: sparePart.unitCost,
                },
            });
            await tx.sparePart.update({
                where: { id: dto.sparePartId },
                data: {
                    quantityOnHand: {
                        decrement: dto.quantityUsed,
                    },
                },
            });
            const currentPartsCost = Number(workOrder.partsCost || 0);
            const additionalCost = Number(sparePart.unitCost) * dto.quantityUsed;
            await tx.workOrder.update({
                where: { id: workOrderId },
                data: {
                    partsCost: currentPartsCost + additionalCost,
                    totalCost: Number(workOrder.totalCost || 0) + additionalCost,
                },
            });
            await tx.assetHistory.create({
                data: {
                    assetId: workOrder.assetId,
                    eventType: 'PART_CONSUMED',
                    actorUserId,
                    metadataJson: {
                        workOrderId,
                        sparePartId: dto.sparePartId,
                        sparePartName: sparePart.name,
                        quantityUsed: dto.quantityUsed,
                    },
                },
            });
            return usage;
        });
        return consumed;
    }
    async cancel(id, actorUserId) {
        const workOrder = await this.prisma.workOrder.findUnique({
            where: { id },
            include: { asset: true },
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Work order is already completed or cancelled');
        }
        const cancelled = await this.prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            if (workOrder.asset.status === 'MAINTENANCE') {
                await tx.asset.update({
                    where: { id: workOrder.assetId },
                    data: { status: 'OPERATIONAL' },
                });
            }
            return wo;
        });
        return cancelled;
    }
};
exports.WorkOrdersService = WorkOrdersService;
exports.WorkOrdersService = WorkOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map