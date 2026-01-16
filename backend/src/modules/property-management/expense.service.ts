import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ExpenseCategory,
  PaymentMethod,
  PaymentFrequency,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateExpenseDto {
  propertyId: string;
  category: ExpenseCategory;
  description: string;
  vendor?: string;
  expenseDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  amount: number;
  currency?: string;
  taxAmount?: number;
  isPaid?: boolean;
  paidDate?: Date;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  isRecurring?: boolean;
  recurringFrequency?: PaymentFrequency;
  invoiceNumber?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
  budgetCategory?: string;
  isCapex?: boolean;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  category?: ExpenseCategory;
  isPaid?: boolean;
  isRecurring?: boolean;
  startDate?: Date;
  endDate?: Date;
  vendor?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  paidExpenses: number;
  unpaidExpenses: number;
  byCategory: Record<ExpenseCategory, number>;
  byMonth: { month: string; amount: number }[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async createExpense(dto: CreateExpenseDto, userId?: string) {
    // Validate property
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found`);
    }

    // Generate expense code
    const count = await this.prisma.propertyExpense.count();
    const expenseCode = `EXP-${String(count + 1).padStart(6, '0')}`;

    const totalAmount = dto.amount + (dto.taxAmount || 0);

    const expense = await this.prisma.propertyExpense.create({
      data: {
        expenseCode,
        propertyId: dto.propertyId,
        category: dto.category,
        description: dto.description,
        vendor: dto.vendor,
        expenseDate: dto.expenseDate,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'USD',
        taxAmount: dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : null,
        totalAmount: new Prisma.Decimal(totalAmount),
        isPaid: dto.isPaid ?? false,
        paidDate: dto.paidDate,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        isRecurring: dto.isRecurring ?? false,
        recurringFrequency: dto.recurringFrequency,
        invoiceNumber: dto.invoiceNumber,
        invoiceUrl: dto.invoiceUrl,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        budgetCategory: dto.budgetCategory,
        isCapex: dto.isCapex ?? false,
        createdById: userId,
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
    });

    return expense;
  }

  async findAllExpenses(params: ExpenseListParams = {}) {
    const {
      page = 1,
      limit = 20,
      propertyId,
      category,
      isPaid,
      isRecurring,
      startDate,
      endDate,
      vendor,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.PropertyExpenseWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (category) where.category = category;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (isRecurring !== undefined) where.isRecurring = isRecurring;
    if (vendor) where.vendor = { contains: vendor, mode: 'insensitive' };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.propertyExpense.findMany({
        where,
        skip,
        take: limit,
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.propertyExpense.count({ where }),
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

  async findExpenseById(id: string) {
    const expense = await this.prisma.propertyExpense.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    await this.findExpenseById(id);

    const updateData: Prisma.PropertyExpenseUpdateInput = {};

    const simpleFields = [
      'category', 'description', 'vendor', 'expenseDate', 'periodStart',
      'periodEnd', 'currency', 'isPaid', 'paidDate', 'paymentMethod',
      'paymentReference', 'isRecurring', 'recurringFrequency', 'invoiceNumber',
      'invoiceUrl', 'receiptUrl', 'notes', 'budgetCategory', 'isCapex',
    ];

    for (const field of simpleFields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    if (dto.amount !== undefined || dto.taxAmount !== undefined) {
      const expense = await this.findExpenseById(id);
      const amount = dto.amount ?? expense.amount.toNumber();
      const taxAmount = dto.taxAmount ?? expense.taxAmount?.toNumber() ?? 0;

      updateData.amount = new Prisma.Decimal(amount);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalAmount = new Prisma.Decimal(amount + taxAmount);
    }

    return this.prisma.propertyExpense.update({
      where: { id },
      data: updateData,
      include: { property: true },
    });
  }

  async deleteExpense(id: string) {
    await this.findExpenseById(id);
    await this.prisma.propertyExpense.delete({ where: { id } });
    return { deleted: true };
  }

  async markAsPaid(id: string, paymentMethod: PaymentMethod, paymentReference?: string) {
    await this.findExpenseById(id);

    return this.prisma.propertyExpense.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: new Date(),
        paymentMethod,
        paymentReference,
      },
    });
  }

  // --------------------------------------------------------------------------
  // EXPENSE SUMMARY & REPORTS
  // --------------------------------------------------------------------------

  async getExpenseSummary(params: { propertyId?: string; startDate?: Date; endDate?: Date } = {}): Promise<ExpenseSummary> {
    const { propertyId, startDate, endDate } = params;

    const where: Prisma.PropertyExpenseWhereInput = {};
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [totalResult, paidResult, unpaidResult, byCategory, expenses] = await Promise.all([
      this.prisma.propertyExpense.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.propertyExpense.aggregate({
        where: { ...where, isPaid: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.propertyExpense.aggregate({
        where: { ...where, isPaid: false },
        _sum: { totalAmount: true },
      }),
      this.prisma.propertyExpense.groupBy({
        by: ['category'],
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.propertyExpense.findMany({
        where,
        select: {
          expenseDate: true,
          totalAmount: true,
        },
      }),
    ]);

    // Calculate by category
    const categoryTotals: Record<ExpenseCategory, number> = {} as any;
    for (const cat of Object.values(ExpenseCategory)) {
      categoryTotals[cat] = 0;
    }
    for (const item of byCategory) {
      categoryTotals[item.category] = item._sum.totalAmount?.toNumber() || 0;
    }

    // Calculate by month
    const monthMap = new Map<string, number>();
    for (const expense of expenses) {
      const month = expense.expenseDate.toISOString().slice(0, 7);
      monthMap.set(month, (monthMap.get(month) || 0) + expense.totalAmount.toNumber());
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalExpenses: totalResult._sum.totalAmount?.toNumber() || 0,
      paidExpenses: paidResult._sum.totalAmount?.toNumber() || 0,
      unpaidExpenses: unpaidResult._sum.totalAmount?.toNumber() || 0,
      byCategory: categoryTotals,
      byMonth,
    };
  }

  async getExpensesByProperty(params: { startDate?: Date; endDate?: Date } = {}) {
    const { startDate, endDate } = params;

    const where: Prisma.PropertyExpenseWhereInput = {};
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const expenses = await this.prisma.propertyExpense.groupBy({
      by: ['propertyId'],
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    const propertyIds = expenses.map(e => e.propertyId);
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, name: true, propertyCode: true },
    });

    const propertyMap = new Map(properties.map(p => [p.id, p]));

    return expenses.map(e => ({
      property: propertyMap.get(e.propertyId),
      totalExpenses: e._sum.totalAmount?.toNumber() || 0,
      expenseCount: e._count,
    }));
  }

  async getUnpaidExpenses(propertyId?: string) {
    const where: Prisma.PropertyExpenseWhereInput = { isPaid: false };
    if (propertyId) where.propertyId = propertyId;

    return this.prisma.propertyExpense.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
      orderBy: { expenseDate: 'asc' },
    });
  }

  async getRecurringExpenses(propertyId?: string) {
    const where: Prisma.PropertyExpenseWhereInput = { isRecurring: true };
    if (propertyId) where.propertyId = propertyId;

    return this.prisma.propertyExpense.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
      orderBy: { category: 'asc' },
    });
  }

  // --------------------------------------------------------------------------
  // EXPENSE FORECASTING
  // --------------------------------------------------------------------------

  async forecastExpenses(propertyId: string, months: number = 12) {
    // Get historical expenses for the past 12 months
    const pastYear = new Date();
    pastYear.setMonth(pastYear.getMonth() - 12);

    const historicalExpenses = await this.prisma.propertyExpense.findMany({
      where: {
        propertyId,
        expenseDate: { gte: pastYear },
      },
    });

    // Calculate average monthly expense by category
    const categoryMonthlyAvg: Record<ExpenseCategory, number> = {} as any;
    for (const cat of Object.values(ExpenseCategory)) {
      categoryMonthlyAvg[cat] = 0;
    }

    const categoryTotals: Record<ExpenseCategory, number> = {} as any;
    for (const cat of Object.values(ExpenseCategory)) {
      categoryTotals[cat] = 0;
    }

    for (const expense of historicalExpenses) {
      categoryTotals[expense.category] += expense.totalAmount.toNumber();
    }

    for (const cat of Object.values(ExpenseCategory)) {
      categoryMonthlyAvg[cat] = categoryTotals[cat] / 12;
    }

    // Get recurring expenses
    const recurringExpenses = await this.prisma.propertyExpense.findMany({
      where: {
        propertyId,
        isRecurring: true,
      },
    });

    // Project future expenses
    const forecast: { month: string; projected: number; byCategory: Record<ExpenseCategory, number> }[] = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const month = futureDate.toISOString().slice(0, 7);

      const monthlyByCategory: Record<ExpenseCategory, number> = {} as any;
      for (const cat of Object.values(ExpenseCategory)) {
        monthlyByCategory[cat] = categoryMonthlyAvg[cat];
      }

      // Add recurring expenses
      for (const recurring of recurringExpenses) {
        if (this.shouldRecurInMonth(recurring, futureDate)) {
          monthlyByCategory[recurring.category] += recurring.totalAmount.toNumber();
        }
      }

      const projected = Object.values(monthlyByCategory).reduce((sum, val) => sum + val, 0);

      forecast.push({
        month,
        projected,
        byCategory: monthlyByCategory,
      });
    }

    return {
      historical: {
        totalExpenses: historicalExpenses.reduce((sum, e) => sum + e.totalAmount.toNumber(), 0),
        byCategory: categoryTotals,
        monthlyAverage: Object.values(categoryMonthlyAvg).reduce((sum, val) => sum + val, 0),
      },
      forecast,
    };
  }

  private shouldRecurInMonth(expense: any, date: Date): boolean {
    if (!expense.recurringFrequency) return false;

    switch (expense.recurringFrequency) {
      case PaymentFrequency.MONTHLY:
        return true;
      case PaymentFrequency.QUARTERLY:
        return date.getMonth() % 3 === expense.expenseDate.getMonth() % 3;
      case PaymentFrequency.ANNUALLY:
        return date.getMonth() === expense.expenseDate.getMonth();
      default:
        return false;
    }
  }
}
