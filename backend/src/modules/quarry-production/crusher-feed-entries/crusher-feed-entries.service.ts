import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherFeedEntryDto } from './dto/create-crusher-feed-entry.dto';
import { UpdateCrusherFeedEntryDto } from './dto/update-crusher-feed-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CrusherFeedEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Auto-calculate feed rate (tonnage / operating hours)
   */
  private calculateFeedRate(
    weighBridgeTonnage: Decimal,
    feedStartTime: Date,
    feedEndTime: Date,
  ): Decimal | null {
    const operatingHours = (feedEndTime.getTime() - feedStartTime.getTime()) / (1000 * 60 * 60);
    
    if (operatingHours <= 0) {
      return null;
    }

    return weighBridgeTonnage.dividedBy(new Decimal(operatingHours));
  }

  async findAll(
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    shift?: Shift,
    crusherId?: string,
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
    if (crusherId) where.crusherId = crusherId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
      throw new NotFoundException('Crusher feed entry not found');
    }

    return entry;
  }

  async create(dto: CreateCrusherFeedEntryDto, createdById: string) {
    const [crusher, materialType] = await Promise.all([
      this.prisma.crusher.findUnique({ where: { id: dto.crusherId } }),
      this.prisma.materialType.findUnique({ where: { id: dto.materialTypeId } }),
    ]);

    if (!crusher) throw new NotFoundException('Crusher not found');
    if (!materialType) throw new NotFoundException('Material type not found');

    const feedStartTime = new Date(dto.feedStartTime);
    const feedEndTime = new Date(dto.feedEndTime);

    if (feedEndTime <= feedStartTime) {
      throw new BadRequestException('Feed end time must be after feed start time');
    }

    // Check for duplicate entry
    const existing = await this.prisma.crusherFeedEntry.findUnique({
      where: {
        date_shift_projectId_crusherId: {
          date: new Date(dto.date),
          shift: dto.shift,
          projectId: dto.projectId,
          crusherId: dto.crusherId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Entry already exists for this date, shift, and crusher combination');
    }

    const weighBridgeTonnage = new Decimal(dto.weighBridgeTonnage);
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
        rejectOversizeTonnage: dto.rejectOversizeTonnage ? new Decimal(dto.rejectOversizeTonnage) : null,
        notes: dto.notes,
        status: EntryStatus.PENDING,
        createdById,
      },
      include: {
        crusher: true,
        materialType: true,
      },
    });
  }

  async update(id: string, dto: UpdateCrusherFeedEntryDto, userId: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING && entry.status !== EntryStatus.REJECTED) {
      throw new BadRequestException('Can only update PENDING or REJECTED entries');
    }

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only update entries you created');
    }

    // If times or tonnage changed, recalculate feed rate
    let feedRate = entry.feedRate;
    const feedStartTime = dto.feedStartTime ? new Date(dto.feedStartTime) : entry.feedStartTime;
    const feedEndTime = dto.feedEndTime ? new Date(dto.feedEndTime) : entry.feedEndTime;
    const weighBridgeTonnage = dto.weighBridgeTonnage ? new Decimal(dto.weighBridgeTonnage) : entry.weighBridgeTonnage;

    if (dto.feedStartTime || dto.feedEndTime || dto.weighBridgeTonnage) {
      if (feedEndTime <= feedStartTime) {
        throw new BadRequestException('Feed end time must be after feed start time');
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
        weighBridgeTonnage: dto.weighBridgeTonnage ? new Decimal(dto.weighBridgeTonnage) : undefined,
        feedRate,
        rejectOversizeTonnage: dto.rejectOversizeTonnage !== undefined ? (dto.rejectOversizeTonnage ? new Decimal(dto.rejectOversizeTonnage) : null) : undefined,
      },
      include: {
        crusher: true,
        materialType: true,
      },
    });
  }

  async approve(id: string, approverId: string, notes?: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot approve entry with status ${entry.status}`);
    }

    return this.prisma.crusherFeedEntry.update({
      where: { id },
      data: {
        status: EntryStatus.APPROVED,
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

  async reject(id: string, approverId: string, reason: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot reject entry with status ${entry.status}`);
    }

    return this.prisma.crusherFeedEntry.update({
      where: { id },
      data: {
        status: EntryStatus.REJECTED,
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

  async remove(id: string, userId: string) {
    const entry = await this.findOne(id);

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only delete entries you created');
    }

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException('Can only delete PENDING entries');
    }

    return this.prisma.crusherFeedEntry.delete({
      where: { id },
    });
  }
}
