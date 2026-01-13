import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateExcavatorEntryDto } from './dto/create-excavator-entry.dto';
import { UpdateExcavatorEntryDto } from './dto/update-excavator-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExcavatorEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Auto-calculate estimated volume and tonnage
   */
  private calculateEstimates(
    bucketCount: number,
    bucketCapacity: Decimal,
    materialDensity: Decimal,
  ): { estimatedVolume: Decimal; estimatedTonnage: Decimal } {
    const estimatedVolume = new Decimal(bucketCount).times(bucketCapacity);
    const estimatedTonnage = estimatedVolume.times(materialDensity);
    return { estimatedVolume, estimatedTonnage };
  }

  async findAll(
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    shift?: Shift,
    excavatorId?: string,
    operatorId?: string,
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
    if (excavatorId) where.excavatorId = excavatorId;
    if (operatorId) where.operatorId = operatorId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
      throw new NotFoundException('Excavator entry not found');
    }

    return entry;
  }

  async create(dto: CreateExcavatorEntryDto, createdById: string) {
    // Fetch related data for calculations
    const [excavator, materialType] = await Promise.all([
      this.prisma.excavator.findUnique({ where: { id: dto.excavatorId } }),
      this.prisma.materialType.findUnique({ where: { id: dto.materialTypeId } }),
    ]);

    if (!excavator) throw new NotFoundException('Excavator not found');
    if (!materialType) throw new NotFoundException('Material type not found');

    // Check for duplicate entry
    const existing = await this.prisma.excavatorEntry.findUnique({
      where: {
        date_shift_projectId_excavatorId_operatorId: {
          date: new Date(dto.date),
          shift: dto.shift,
          projectId: dto.projectId,
          excavatorId: dto.excavatorId,
          operatorId: dto.operatorId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Entry already exists for this date, shift, excavator, and operator combination');
    }

    // Auto-calculate estimates
    const { estimatedVolume, estimatedTonnage } = this.calculateEstimates(
      dto.bucketCount,
      excavator.bucketCapacity,
      materialType.density,
    );

    return this.prisma.excavatorEntry.create({
      data: {
        date: new Date(dto.date),
        shift: dto.shift,
        projectId: dto.projectId,
        excavatorId: dto.excavatorId,
        operatorId: dto.operatorId,
        materialTypeId: dto.materialTypeId,
        pitLocationId: dto.pitLocationId,
        bucketCount: dto.bucketCount,
        estimatedVolume,
        estimatedTonnage,
        downtimeHours: dto.downtimeHours ? new Decimal(dto.downtimeHours) : null,
        notes: dto.notes,
        status: EntryStatus.PENDING,
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

  async update(id: string, dto: UpdateExcavatorEntryDto, userId: string) {
    const entry = await this.findOne(id);

    // Only allow updates to PENDING or REJECTED entries
    if (entry.status !== EntryStatus.PENDING && entry.status !== EntryStatus.REJECTED) {
      throw new BadRequestException('Can only update PENDING or REJECTED entries');
    }

    // Only creator can update
    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only update entries you created');
    }

    // If bucket count or related fields changed, recalculate
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

      if (!excavator) throw new NotFoundException('Excavator not found');
      if (!materialType) throw new NotFoundException('Material type not found');

      const calculations = this.calculateEstimates(
        bucketCount,
        excavator.bucketCapacity,
        materialType.density,
      );
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
        downtimeHours: dto.downtimeHours !== undefined ? (dto.downtimeHours ? new Decimal(dto.downtimeHours) : null) : undefined,
      },
      include: {
        excavator: true,
        operator: { select: { id: true, firstName: true, lastName: true } },
        materialType: true,
        pitLocation: true,
      },
    });
  }

  async approve(id: string, approverId: string, notes?: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot approve entry with status ${entry.status}`);
    }

    return this.prisma.excavatorEntry.update({
      where: { id },
      data: {
        status: EntryStatus.APPROVED,
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

  async reject(id: string, approverId: string, reason: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot reject entry with status ${entry.status}`);
    }

    return this.prisma.excavatorEntry.update({
      where: { id },
      data: {
        status: EntryStatus.REJECTED,
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

  async remove(id: string, userId: string) {
    const entry = await this.findOne(id);

    // Only creator can delete, and only if PENDING
    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only delete entries you created');
    }

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException('Can only delete PENDING entries');
    }

    return this.prisma.excavatorEntry.delete({
      where: { id },
    });
  }
}
