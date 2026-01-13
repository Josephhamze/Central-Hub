import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateStockLevelDto } from './dto/create-stock-level.dto';
import { UpdateStockLevelDto } from './dto/update-stock-level.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { EntryStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StockLevelsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get previous day's closing stock
   */
  private async getPreviousDayClosingStock(
    date: Date,
    productTypeId: string,
    stockpileLocationId: string,
  ): Promise<Decimal> {
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousStock = await this.prisma.stockLevel.findUnique({
      where: {
        date_productTypeId_stockpileLocationId: {
          date: previousDate,
          productTypeId,
          stockpileLocationId,
        },
      },
    });

    return previousStock ? previousStock.closingStock : new Decimal(0);
  }

  /**
   * Calculate produced tonnage from approved crusher output entries
   */
  private async calculateProduced(
    date: Date,
    productTypeId: string,
    stockpileLocationId: string,
  ): Promise<Decimal> {
    const entries = await this.prisma.crusherOutputEntry.findMany({
      where: {
        date,
        productTypeId,
        stockpileLocationId,
        status: EntryStatus.APPROVED,
      },
    });

    return entries.reduce(
      (sum, entry) => sum.plus(entry.outputTonnage),
      new Decimal(0),
    );
  }

  /**
   * Calculate closing stock: opening + produced - sold + adjustments
   */
  private calculateClosingStock(
    openingStock: Decimal,
    produced: Decimal,
    sold: Decimal,
    adjustments: Decimal,
  ): Decimal {
    return openingStock.plus(produced).minus(sold).plus(adjustments);
  }

  async findAll(
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    productTypeId?: string,
    stockpileLocationId?: string,
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
    if (productTypeId) where.productTypeId = productTypeId;
    if (stockpileLocationId) where.stockpileLocationId = stockpileLocationId;

    const [items, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          productType: { select: { id: true, name: true } },
          stockpileLocation: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ date: 'desc' }],
      }),
      this.prisma.stockLevel.count({ where }),
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
    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: { id },
      include: {
        productType: true,
        stockpileLocation: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!stockLevel) {
      throw new NotFoundException('Stock level not found');
    }

    return stockLevel;
  }

  async getCurrentStock(productTypeId?: string, stockpileLocationId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { date: today };
    if (productTypeId) where.productTypeId = productTypeId;
    if (stockpileLocationId) where.stockpileLocationId = stockpileLocationId;

    return this.prisma.stockLevel.findMany({
      where,
      include: {
        productType: { select: { id: true, name: true } },
        stockpileLocation: { select: { id: true, name: true } },
      },
      orderBy: [
        { productType: { name: 'asc' } },
        { stockpileLocation: { name: 'asc' } },
      ],
    });
  }

  async createOrUpdate(dto: CreateStockLevelDto, createdById: string) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    // Check if stock level already exists
    const existing = await this.prisma.stockLevel.findUnique({
      where: {
        date_productTypeId_stockpileLocationId: {
          date,
          productTypeId: dto.productTypeId,
          stockpileLocationId: dto.stockpileLocationId,
        },
      },
    });

    // Get opening stock (from previous day or provided)
    const openingStock = dto.openingStock !== undefined
      ? new Decimal(dto.openingStock)
      : await this.getPreviousDayClosingStock(date, dto.productTypeId, dto.stockpileLocationId);

    // Calculate produced from approved crusher output entries
    const produced = await this.calculateProduced(date, dto.productTypeId, dto.stockpileLocationId);

    const sold = dto.sold ? new Decimal(dto.sold) : new Decimal(0);
    const adjustments = dto.adjustments ? new Decimal(dto.adjustments) : new Decimal(0);

    // Calculate closing stock
    const closingStock = this.calculateClosingStock(openingStock, produced, sold, adjustments);

    if (existing) {
      return this.prisma.stockLevel.update({
        where: { id: existing.id },
        data: {
          openingStock,
          produced,
          sold,
          adjustments,
          adjustmentReason: dto.adjustmentReason,
          closingStock,
        },
        include: {
          productType: true,
          stockpileLocation: true,
        },
      });
    }

    return this.prisma.stockLevel.create({
      data: {
        date,
        productTypeId: dto.productTypeId,
        stockpileLocationId: dto.stockpileLocationId,
        openingStock,
        produced,
        sold,
        adjustments,
        adjustmentReason: dto.adjustmentReason,
        closingStock,
        createdById,
      },
      include: {
        productType: true,
        stockpileLocation: true,
      },
    });
  }

  async adjustStock(id: string, dto: AdjustStockDto, createdById: string) {
    const stockLevel = await this.findOne(id);

    const adjustments = new Decimal(dto.adjustments);
    const newAdjustments = stockLevel.adjustments.plus(adjustments);

    // Recalculate closing stock with new adjustment
    const closingStock = this.calculateClosingStock(
      stockLevel.openingStock,
      stockLevel.produced,
      stockLevel.sold,
      newAdjustments,
    );

    return this.prisma.stockLevel.update({
      where: { id },
      data: {
        adjustments: newAdjustments,
        adjustmentReason: stockLevel.adjustmentReason
          ? `${stockLevel.adjustmentReason}\n\n${dto.adjustmentReason}: ${dto.adjustments}`
          : `${dto.adjustmentReason}: ${dto.adjustments}`,
        closingStock,
      },
      include: {
        productType: true,
        stockpileLocation: true,
      },
    });
  }

  /**
   * Recalculate stock for a specific date
   * Useful when crusher output entries are approved/updated
   */
  async recalculateStock(date: Date, productTypeId: string, stockpileLocationId: string) {
    date.setHours(0, 0, 0, 0);

    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: {
        date_productTypeId_stockpileLocationId: {
          date,
          productTypeId,
          stockpileLocationId,
        },
      },
    });

    if (!stockLevel) {
      throw new NotFoundException('Stock level not found for this date');
    }

    // Recalculate produced from approved entries
    const produced = await this.calculateProduced(date, productTypeId, stockpileLocationId);

    // Recalculate closing stock
    const closingStock = this.calculateClosingStock(
      stockLevel.openingStock,
      produced,
      stockLevel.sold,
      stockLevel.adjustments,
    );

    return this.prisma.stockLevel.update({
      where: { id: stockLevel.id },
      data: {
        produced,
        closingStock,
      },
      include: {
        productType: true,
        stockpileLocation: true,
      },
    });
  }
}
