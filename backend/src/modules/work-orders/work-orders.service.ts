import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import { ConsumePartDto } from './dto/consume-part.dto';
import { WorkOrderStatus, WorkOrderType, AssetStatus } from '@prisma/client';

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: WorkOrderStatus, assetId?: string) {
    try {
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;

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
    } catch (error) {
      console.error('Error in workOrders.findAll:', error);
      // Return empty result on error
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

  async findOne(id: string) {
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
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  async create(dto: CreateWorkOrderDto, actorUserId: string) {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    // Validate schedule if provided
    if (dto.scheduleId) {
      const schedule = await this.prisma.maintenanceSchedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule) {
        throw new BadRequestException('Maintenance schedule not found');
      }
      if (schedule.assetId !== dto.assetId) {
        throw new BadRequestException('Schedule does not belong to this asset');
      }
    }

    // Validate assigned user if provided
    if (dto.assignedToUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToUserId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
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

    // Log to asset history
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

  async update(id: string, dto: UpdateWorkOrderDto) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
      throw new BadRequestException('Cannot update completed or cancelled work order');
    }

    const updateData: any = {};
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

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

  async start(id: string, actorUserId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status !== 'OPEN') {
      throw new BadRequestException('Only open work orders can be started');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Update asset status if needed
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

  async complete(id: string, dto: CompleteWorkOrderDto, actorUserId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        asset: true,
        schedule: true,
        partUsages: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
      throw new BadRequestException('Work order is already completed or cancelled');
    }

    // Calculate total parts cost
    const partsCost = workOrder.partUsages.reduce(
      (sum, usage) => sum + Number(usage.costSnapshot) * Number(usage.quantityUsed),
      0,
    );

    const laborCost = dto.laborCost || 0;
    const totalCost = partsCost + laborCost;

    const completed = await this.prisma.$transaction(async (tx) => {
      // Update work order
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

      // Update maintenance schedule if this was from a schedule
      if (workOrder.scheduleId) {
        const schedule = await tx.maintenanceSchedule.findUnique({
          where: { id: workOrder.scheduleId },
        });

        if (schedule) {
          let nextDueAt: Date | null = null;
          if (schedule.type === 'TIME_BASED' && schedule.intervalDays) {
            nextDueAt = new Date();
            nextDueAt.setDate(nextDueAt.getDate() + schedule.intervalDays);
          } else if (schedule.type === 'USAGE_BASED' && schedule.intervalHours) {
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

      // Update asset status back to operational
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

      // Log work order completion to asset history
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

  async consumePart(workOrderId: string, dto: ConsumePartDto, actorUserId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
      throw new BadRequestException('Cannot consume parts for completed or cancelled work order');
    }

    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id: dto.sparePartId },
    });

    if (!sparePart) {
      throw new NotFoundException('Spare part not found');
    }

    // Check stock availability
    if (Number(sparePart.quantityOnHand) < dto.quantityUsed) {
      throw new BadRequestException('Insufficient stock available');
    }

    const consumed = await this.prisma.$transaction(async (tx) => {
      // Create part usage record
      const usage = await tx.partUsage.create({
        data: {
          workOrderId,
          sparePartId: dto.sparePartId,
          quantityUsed: dto.quantityUsed,
          costSnapshot: sparePart.unitCost,
        },
      });

      // Update spare part stock
      await tx.sparePart.update({
        where: { id: dto.sparePartId },
        data: {
          quantityOnHand: {
            decrement: dto.quantityUsed,
          },
        },
      });

      // Update work order parts cost
      const currentPartsCost = Number(workOrder.partsCost || 0);
      const additionalCost = Number(sparePart.unitCost) * dto.quantityUsed;
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          partsCost: currentPartsCost + additionalCost,
          totalCost: Number(workOrder.totalCost || 0) + additionalCost,
        },
      });

      // Log to asset history
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

  async cancel(id: string, actorUserId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
      throw new BadRequestException('Work order is already completed or cancelled');
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // If asset was in maintenance, return to operational
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
}
