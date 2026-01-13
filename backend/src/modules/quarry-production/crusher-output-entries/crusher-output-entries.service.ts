import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherOutputEntryDto } from './dto/create-crusher-output-entry.dto';
import { UpdateCrusherOutputEntryDto } from './dto/update-crusher-output-entry.dto';
import { EntryStatus, Shift } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CrusherOutputEntriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate yield percentage: (outputTonnage / crusherFeedTonnage) × 100
   * Uses same-day, same-crusher, same-shift approved feed entries
   */
  private async calculateYieldPercentage(
    date: Date,
    shift: Shift,
    crusherId: string,
    outputTonnage: Decimal,
  ): Promise<Decimal | null> {
    // Sum approved feed entries for same date, shift, and crusher
    const feedEntries = await this.prisma.crusherFeedEntry.findMany({
      where: {
        date,
        shift,
        crusherId,
        status: EntryStatus.APPROVED,
      },
    });

    if (feedEntries.length === 0) {
      return null; // No feed data to compare
    }

    const totalFeedTonnage = feedEntries.reduce(
      (sum, entry) => sum.plus(entry.weighBridgeTonnage),
      new Decimal(0),
    );

    if (totalFeedTonnage.isZero()) {
      return null;
    }

    // Yield = (output / feed) × 100
    return outputTonnage.dividedBy(totalFeedTonnage).times(100);
  }

  async findAll(
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    shift?: Shift,
    crusherId?: string,
    productTypeId?: string,
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
    if (productTypeId) where.productTypeId = productTypeId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
      throw new NotFoundException('Crusher output entry not found');
    }

    return entry;
  }

  async create(dto: CreateCrusherOutputEntryDto, createdById: string) {
    const [crusher, productType, stockpileLocation] = await Promise.all([
      this.prisma.crusher.findUnique({ where: { id: dto.crusherId } }),
      this.prisma.productType.findUnique({ where: { id: dto.productTypeId } }),
      this.prisma.stockpileLocation.findUnique({ where: { id: dto.stockpileLocationId } }),
    ]);

    if (!crusher) throw new NotFoundException('Crusher not found');
    if (!productType) throw new NotFoundException('Product type not found');
    if (!stockpileLocation) throw new NotFoundException('Stockpile location not found');

    const date = new Date(dto.date);
    const outputTonnage = new Decimal(dto.outputTonnage);
    
    // Calculate yield percentage
    const yieldPercentage = await this.calculateYieldPercentage(
      date,
      dto.shift,
      dto.crusherId,
      outputTonnage,
    );

    return this.prisma.crusherOutputEntry.create({
      data: {
        date,
        shift: dto.shift,
        projectId: dto.projectId,
        crusherId: dto.crusherId,
        productTypeId: dto.productTypeId,
        stockpileLocationId: dto.stockpileLocationId,
        outputTonnage,
        yieldPercentage,
        qualityGrade: dto.qualityGrade,
        moisturePercentage: dto.moisturePercentage ? new Decimal(dto.moisturePercentage) : null,
        notes: dto.notes,
        status: EntryStatus.PENDING,
        createdById,
      },
      include: {
        crusher: true,
        productType: true,
        stockpileLocation: true,
      },
    });
  }

  async update(id: string, dto: UpdateCrusherOutputEntryDto, userId: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING && entry.status !== EntryStatus.REJECTED) {
      throw new BadRequestException('Can only update PENDING or REJECTED entries');
    }

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only update entries you created');
    }

    // If output tonnage, date, shift, or crusher changed, recalculate yield
    let yieldPercentage = entry.yieldPercentage;
    const date = dto.date ? new Date(dto.date) : entry.date;
    const shift = dto.shift || entry.shift;
    const crusherId = dto.crusherId || entry.crusherId;
    const outputTonnage = dto.outputTonnage ? new Decimal(dto.outputTonnage) : entry.outputTonnage;

    if (dto.outputTonnage || dto.date || dto.shift || dto.crusherId) {
      yieldPercentage = await this.calculateYieldPercentage(date, shift, crusherId, outputTonnage);
    }

    return this.prisma.crusherOutputEntry.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        outputTonnage: dto.outputTonnage ? new Decimal(dto.outputTonnage) : undefined,
        yieldPercentage,
        moisturePercentage: dto.moisturePercentage !== undefined ? (dto.moisturePercentage ? new Decimal(dto.moisturePercentage) : null) : undefined,
      },
      include: {
        crusher: true,
        productType: true,
        stockpileLocation: true,
      },
    });
  }

  async approve(id: string, approverId: string, notes?: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot approve entry with status ${entry.status}`);
    }

    return this.prisma.crusherOutputEntry.update({
      where: { id },
      data: {
        status: EntryStatus.APPROVED,
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

  async reject(id: string, approverId: string, reason: string) {
    const entry = await this.findOne(id);

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException(`Cannot reject entry with status ${entry.status}`);
    }

    return this.prisma.crusherOutputEntry.update({
      where: { id },
      data: {
        status: EntryStatus.REJECTED,
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

  async remove(id: string, userId: string) {
    const entry = await this.findOne(id);

    if (entry.createdById !== userId) {
      throw new ForbiddenException('You can only delete entries you created');
    }

    if (entry.status !== EntryStatus.PENDING) {
      throw new BadRequestException('Can only delete PENDING entries');
    }

    return this.prisma.crusherOutputEntry.delete({
      where: { id },
    });
  }
}
