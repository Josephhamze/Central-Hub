import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { MaintenanceScheduleType } from '@prisma/client';

@Injectable()
export class MaintenanceSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, assetId?: string, isActive?: boolean) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (assetId) where.assetId = assetId;
    if (isActive !== undefined) where.isActive = isActive;

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
        orderBy: { nextDueAt: 'asc' },
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

  async findOne(id: string) {
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
      throw new NotFoundException('Maintenance schedule not found');
    }

    return schedule;
  }

  async create(dto: CreateMaintenanceScheduleDto) {
    // Validate asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    // Validate type-specific fields
    if (dto.type === MaintenanceScheduleType.TIME_BASED && !dto.intervalDays) {
      throw new BadRequestException('intervalDays is required for time-based schedules');
    }

    if (dto.type === MaintenanceScheduleType.USAGE_BASED && !dto.intervalHours) {
      throw new BadRequestException('intervalHours is required for usage-based schedules');
    }

    // Calculate nextDueAt
    let nextDueAt: Date | null = null;
    if (dto.type === MaintenanceScheduleType.TIME_BASED && dto.intervalDays) {
      nextDueAt = new Date();
      nextDueAt.setDate(nextDueAt.getDate() + dto.intervalDays);
    } else if (dto.type === MaintenanceScheduleType.USAGE_BASED && dto.intervalHours) {
      // For usage-based, we'll set it based on current date + hours
      // In practice, this would be calculated from actual usage data
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

  async update(id: string, dto: UpdateMaintenanceScheduleDto) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }

    // Recalculate nextDueAt if interval changed
    let nextDueAt = schedule.nextDueAt;
    if (dto.intervalDays !== undefined || dto.intervalHours !== undefined) {
      if (schedule.type === MaintenanceScheduleType.TIME_BASED) {
        const intervalDays = dto.intervalDays ?? schedule.intervalDays;
        if (intervalDays) {
          const baseDate = schedule.lastPerformedAt || new Date();
          nextDueAt = new Date(baseDate);
          nextDueAt.setDate(nextDueAt.getDate() + intervalDays);
        }
      } else if (schedule.type === MaintenanceScheduleType.USAGE_BASED) {
        const intervalHours = dto.intervalHours ?? schedule.intervalHours;
        if (intervalHours) {
          const baseDate = schedule.lastPerformedAt || new Date();
          nextDueAt = new Date(baseDate);
          nextDueAt.setHours(nextDueAt.getHours() + intervalHours);
        }
      }
    }

    const updateData: any = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.intervalDays !== undefined) updateData.intervalDays = dto.intervalDays;
    if (dto.intervalHours !== undefined) updateData.intervalHours = dto.intervalHours;
    if (dto.checklistJson !== undefined) updateData.checklistJson = dto.checklistJson;
    if (dto.estimatedDurationHours !== undefined) updateData.estimatedDurationHours = dto.estimatedDurationHours;
    if (dto.requiredPartsJson !== undefined) updateData.requiredPartsJson = dto.requiredPartsJson;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (nextDueAt !== schedule.nextDueAt) updateData.nextDueAt = nextDueAt;

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

  async remove(id: string) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { workOrders: true },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }

    if (schedule._count.workOrders > 0) {
      throw new BadRequestException('Cannot delete schedule with associated work orders');
    }

    await this.prisma.maintenanceSchedule.delete({
      where: { id },
    });

    return { message: 'Maintenance schedule deleted successfully' };
  }

  async getOverdue() {
    const now = new Date();
    const overdue = await this.prisma.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        nextDueAt: { lte: now },
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
}
