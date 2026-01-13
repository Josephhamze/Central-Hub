import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateHaulingEntryDto } from './dto/create-hauling-entry.dto';
import { UpdateHaulingEntryDto } from './dto/update-hauling-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class HaulingEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Auto-calculate total hauled
   */
  private calculateTotalHauled(tripCount: number, loadCapacity: Decimal): Decimal {
    return new Decimal(tripCount).times(loadCapacity);
  }

  async findAll(
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    shift?: Shift,
    truckId?: string,
    driverId?: string,
    status?: EntryStatus,
  ) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (shift) where.shift = shift;
    if (truckId) where.truckId = truckId;
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
      throw new NotFoundException('Hauling entry not found');
    }

    return entry;
  }

  async create(dto: CreateHaulingEntryDto, createdById: string) {
    const truck = await this.prisma.truck.findUnique({
      where: { id: dto.truckId },
    });

    if (!truck) throw new NotFoundException('Truck not found');

    // Check for duplicate entry
    const existing = await this.prisma.haulingEntry.findUnique({
      where: {
        date_shift_projectId_truckId_driverId: {
          date: new Date(dto.date),
          shift: dto.shift,
          projectId: dto.projectId,
          truckId: dto.truckId,
          driverId: dto.driverId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Entry already exists for this date, shift, truck, and driver combination');
    }

    // Auto-calculate total hauled
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
        avgCycleTime: dto.avgCycleTime ? new Decimal(dto.avgCycleTime) : null,
        fuelConsumption: dto.fuelConsumption ? new Decimal(dto.fuelConsumption) : null,
        notes: dto.notes,
        status: EntryStatus.PENDING,
        createdById,
      },
      include: {
        truck: true,
        driver: { select: { id: true, firstName: true, lastName: true } },
        sourceExcavatorEntry: true,
      },
    });
  }

  async update(id: string, dto: UpdateHaulingEntryDto, userId: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING && entry.status !== EntryStatus.REJECTED) {
      throw new BadRequestException('Can only update PENDING or REJECTED entries');
    }

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only update entries you created');
    }

    // If trip count or truck changed, recalculate
    let totalHauled = entry.totalHauled;

    if (dto.tripCount || dto.truckId) {
      const truckId = dto.truckId || entry.truckId;
      const tripCount = dto.tripCount || entry.tripCount;

      const truck = await this.prisma.truck.findUnique({
        where: { id: truckId },
      });

      if (!truck) throw new NotFoundException('Truck not found');

      totalHauled = this.calculateTotalHauled(tripCount, truck.loadCapacity);
    }

    const updateData: any = {};
    
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
      updateData.avgCycleTime = dto.avgCycleTime ? new Decimal(dto.avgCycleTime) : null;
    }
    if (dto.fuelConsumption !== undefined) {
      updateData.fuelConsumption = dto.fuelConsumption ? new Decimal(dto.fuelConsumption) : null;
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

  async approve(id: string, approverId: string, notes?: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot approve entry with status ${entry.status}`);
    }

    return this.prisma.haulingEntry.update({
      where: { id },
      data: {
        status: EntryStatus.APPROVED,
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

  async reject(id: string, approverId: string, reason: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot reject entry with status ${entry.status}`);
    }

    return this.prisma.haulingEntry.update({
      where: { id },
      data: {
        status: EntryStatus.REJECTED,
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

  async remove(id: string, userId: string) {
    const entry = await this.findOne(id);

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only delete entries you created');
    }

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException('Can only delete PENDING entries');
    }

    return this.prisma.haulingEntry.delete({
      where: { id },
    });
  }
}
