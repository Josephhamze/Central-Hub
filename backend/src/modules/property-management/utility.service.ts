import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  UtilityType,
  BillAllocation,
  BillStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateUtilityBillDto {
  propertyId: string;
  unitId?: string;
  utilityType: UtilityType;
  provider?: string;
  accountNumber?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  billDate: Date;
  dueDate: Date;
  previousReading?: number;
  currentReading?: number;
  consumptionUnit?: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  allocation?: BillAllocation;
  tenantSharePct?: number;
  billUrl?: string;
  notes?: string;
}

export interface UpdateUtilityBillDto extends Partial<CreateUtilityBillDto> {
  status?: BillStatus;
  paidDate?: Date;
  paidAmount?: number;
  paymentReference?: string;
}

export interface UtilityBillListParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  unitId?: string;
  utilityType?: UtilityType;
  status?: BillStatus;
  allocation?: BillAllocation;
  startDate?: Date;
  endDate?: Date;
}

export interface UtilitySummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  byType: Record<UtilityType, number>;
  byMonth: { month: string; amount: number }[];
  byAllocation: Record<BillAllocation, number>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class UtilityService {
  constructor(private prisma: PrismaService) {}

  async createBill(dto: CreateUtilityBillDto, userId?: string) {
    // Validate property
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found`);
    }

    // Validate unit if provided
    if (dto.unitId) {
      const unit = await this.prisma.propertyUnit.findUnique({
        where: { id: dto.unitId },
      });
      if (!unit || unit.propertyId !== dto.propertyId) {
        throw new NotFoundException(`Unit with ID ${dto.unitId} not found in this property`);
      }
    }

    // Generate bill code
    const count = await this.prisma.utilityBill.count();
    const billCode = `UTIL-${String(count + 1).padStart(6, '0')}`;

    // Calculate consumption
    let consumption: number | null = null;
    if (dto.previousReading !== undefined && dto.currentReading !== undefined) {
      consumption = dto.currentReading - dto.previousReading;
    }

    const totalAmount = dto.amount + (dto.taxAmount || 0);

    const bill = await this.prisma.utilityBill.create({
      data: {
        billCode,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        utilityType: dto.utilityType,
        provider: dto.provider,
        accountNumber: dto.accountNumber,
        billingPeriodStart: dto.billingPeriodStart,
        billingPeriodEnd: dto.billingPeriodEnd,
        billDate: dto.billDate,
        dueDate: dto.dueDate,
        previousReading: dto.previousReading ? new Prisma.Decimal(dto.previousReading) : null,
        currentReading: dto.currentReading ? new Prisma.Decimal(dto.currentReading) : null,
        consumption: consumption ? new Prisma.Decimal(consumption) : null,
        consumptionUnit: dto.consumptionUnit,
        amount: new Prisma.Decimal(dto.amount),
        taxAmount: dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : null,
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: dto.currency ?? 'USD',
        allocation: dto.allocation ?? BillAllocation.LANDLORD,
        tenantSharePct: dto.tenantSharePct ? new Prisma.Decimal(dto.tenantSharePct) : null,
        status: BillStatus.PENDING,
        billUrl: dto.billUrl,
        notes: dto.notes,
        createdById: userId,
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
        unit: {
          select: { id: true, name: true, unitCode: true },
        },
      },
    });

    return bill;
  }

  async findAllBills(params: UtilityBillListParams = {}) {
    const {
      page = 1,
      limit = 20,
      propertyId,
      unitId,
      utilityType,
      status,
      allocation,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.UtilityBillWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (utilityType) where.utilityType = utilityType;
    if (status) where.status = status;
    if (allocation) where.allocation = allocation;

    if (startDate || endDate) {
      where.billingPeriodStart = {};
      if (startDate) where.billingPeriodStart.gte = startDate;
      if (endDate) where.billingPeriodStart.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.utilityBill.findMany({
        where,
        skip,
        take: limit,
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
          unit: {
            select: { id: true, name: true, unitCode: true },
          },
        },
        orderBy: { billDate: 'desc' },
      }),
      this.prisma.utilityBill.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBillById(id: string) {
    const bill = await this.prisma.utilityBill.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
      },
    });

    if (!bill) {
      throw new NotFoundException(`Utility bill with ID ${id} not found`);
    }

    return bill;
  }

  async updateBill(id: string, dto: UpdateUtilityBillDto) {
    await this.findBillById(id);

    const updateData: Prisma.UtilityBillUpdateInput = {};

    const simpleFields = [
      'utilityType', 'provider', 'accountNumber', 'billingPeriodStart',
      'billingPeriodEnd', 'billDate', 'dueDate', 'consumptionUnit',
      'currency', 'allocation', 'status', 'paidDate', 'paymentReference',
      'billUrl', 'notes',
    ];

    for (const field of simpleFields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    // Handle meter readings and consumption
    if (dto.previousReading !== undefined || dto.currentReading !== undefined) {
      const bill = await this.findBillById(id);
      const prevReading = dto.previousReading ?? bill.previousReading?.toNumber();
      const currReading = dto.currentReading ?? bill.currentReading?.toNumber();

      if (prevReading !== undefined) {
        updateData.previousReading = new Prisma.Decimal(prevReading);
      }
      if (currReading !== undefined) {
        updateData.currentReading = new Prisma.Decimal(currReading);
      }
      if (prevReading !== undefined && currReading !== undefined) {
        updateData.consumption = new Prisma.Decimal(currReading - prevReading);
      }
    }

    // Handle amounts
    if (dto.amount !== undefined || dto.taxAmount !== undefined) {
      const bill = await this.findBillById(id);
      const amount = dto.amount ?? bill.amount.toNumber();
      const taxAmount = dto.taxAmount ?? bill.taxAmount?.toNumber() ?? 0;

      updateData.amount = new Prisma.Decimal(amount);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalAmount = new Prisma.Decimal(amount + taxAmount);
    }

    if (dto.paidAmount !== undefined) {
      updateData.paidAmount = new Prisma.Decimal(dto.paidAmount);
    }

    if (dto.tenantSharePct !== undefined) {
      updateData.tenantSharePct = new Prisma.Decimal(dto.tenantSharePct);
    }

    return this.prisma.utilityBill.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        unit: true,
      },
    });
  }

  async deleteBill(id: string) {
    await this.findBillById(id);
    await this.prisma.utilityBill.delete({ where: { id } });
    return { deleted: true };
  }

  async markAsPaid(id: string, paidAmount: number, paymentReference?: string) {
    const bill = await this.findBillById(id);

    const status = paidAmount >= bill.totalAmount.toNumber()
      ? BillStatus.PAID
      : BillStatus.PENDING;

    return this.prisma.utilityBill.update({
      where: { id },
      data: {
        status,
        paidDate: new Date(),
        paidAmount: new Prisma.Decimal(paidAmount),
        paymentReference,
      },
    });
  }

  // --------------------------------------------------------------------------
  // UTILITY SUMMARY & REPORTS
  // --------------------------------------------------------------------------

  async getUtilitySummary(params: { propertyId?: string; startDate?: Date; endDate?: Date } = {}): Promise<UtilitySummary> {
    const { propertyId, startDate, endDate } = params;

    const where: Prisma.UtilityBillWhereInput = {};
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.billingPeriodStart = {};
      if (startDate) where.billingPeriodStart.gte = startDate;
      if (endDate) where.billingPeriodStart.lte = endDate;
    }

    const [totalBilled, totalPaid, byType, byAllocation, bills] = await Promise.all([
      this.prisma.utilityBill.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.utilityBill.aggregate({
        where: { ...where, status: BillStatus.PAID },
        _sum: { paidAmount: true },
      }),
      this.prisma.utilityBill.groupBy({
        by: ['utilityType'],
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.utilityBill.groupBy({
        by: ['allocation'],
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.utilityBill.findMany({
        where,
        select: {
          billingPeriodStart: true,
          totalAmount: true,
        },
      }),
    ]);

    // By type
    const typeTotals: Record<UtilityType, number> = {} as any;
    for (const type of Object.values(UtilityType)) {
      typeTotals[type] = 0;
    }
    for (const item of byType) {
      typeTotals[item.utilityType] = item._sum.totalAmount?.toNumber() || 0;
    }

    // By allocation
    const allocationTotals: Record<BillAllocation, number> = {} as any;
    for (const alloc of Object.values(BillAllocation)) {
      allocationTotals[alloc] = 0;
    }
    for (const item of byAllocation) {
      allocationTotals[item.allocation] = item._sum.totalAmount?.toNumber() || 0;
    }

    // By month
    const monthMap = new Map<string, number>();
    for (const bill of bills) {
      const month = bill.billingPeriodStart.toISOString().slice(0, 7);
      monthMap.set(month, (monthMap.get(month) || 0) + bill.totalAmount.toNumber());
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalBilledAmount = totalBilled._sum.totalAmount?.toNumber() || 0;
    const totalPaidAmount = totalPaid._sum.paidAmount?.toNumber() || 0;

    return {
      totalBilled: totalBilledAmount,
      totalPaid: totalPaidAmount,
      totalOutstanding: totalBilledAmount - totalPaidAmount,
      byType: typeTotals,
      byMonth,
      byAllocation: allocationTotals,
    };
  }

  async getOverdueBills(propertyId?: string) {
    const where: Prisma.UtilityBillWhereInput = {
      status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] },
      dueDate: { lt: new Date() },
    };
    if (propertyId) where.propertyId = propertyId;

    return this.prisma.utilityBill.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
        unit: {
          select: { id: true, name: true, unitCode: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getConsumptionTrend(propertyId: string, utilityType: UtilityType, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const bills = await this.prisma.utilityBill.findMany({
      where: {
        propertyId,
        utilityType,
        billingPeriodStart: { gte: startDate },
        consumption: { not: null },
      },
      select: {
        billingPeriodStart: true,
        consumption: true,
        totalAmount: true,
      },
      orderBy: { billingPeriodStart: 'asc' },
    });

    return bills.map(bill => ({
      period: bill.billingPeriodStart.toISOString().slice(0, 7),
      consumption: bill.consumption?.toNumber() || 0,
      cost: bill.totalAmount.toNumber(),
    }));
  }

  async getUtilityCostReport(params: { startDate: Date; endDate: Date; propertyId?: string }) {
    const { startDate, endDate, propertyId } = params;

    const where: Prisma.UtilityBillWhereInput = {
      billingPeriodStart: { gte: startDate, lte: endDate },
    };
    if (propertyId) where.propertyId = propertyId;

    const bills = await this.prisma.utilityBill.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
        unit: {
          select: { id: true, name: true, unitCode: true },
        },
      },
      orderBy: [{ propertyId: 'asc' }, { utilityType: 'asc' }, { billingPeriodStart: 'asc' }],
    });

    // Group by property and utility type
    const report: Map<string, {
      property: any;
      byType: Map<UtilityType, { total: number; count: number; avgConsumption: number }>;
      total: number;
    }> = new Map();

    for (const bill of bills) {
      if (!report.has(bill.propertyId)) {
        report.set(bill.propertyId, {
          property: bill.property,
          byType: new Map(),
          total: 0,
        });
      }

      const propReport = report.get(bill.propertyId)!;
      propReport.total += bill.totalAmount.toNumber();

      if (!propReport.byType.has(bill.utilityType)) {
        propReport.byType.set(bill.utilityType, { total: 0, count: 0, avgConsumption: 0 });
      }

      const typeReport = propReport.byType.get(bill.utilityType)!;
      typeReport.total += bill.totalAmount.toNumber();
      typeReport.count += 1;
      if (bill.consumption) {
        typeReport.avgConsumption += bill.consumption.toNumber() / typeReport.count;
      }
    }

    return Array.from(report.values()).map(r => ({
      ...r,
      byType: Object.fromEntries(r.byType),
    }));
  }
}
