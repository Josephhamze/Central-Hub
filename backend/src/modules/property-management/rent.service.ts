import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PaymentMethod,
  RentPaymentStatus,
  TenantStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateRentPaymentDto {
  tenantId: string;
  leaseId: string;
  rentScheduleId?: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  rentPortion?: number;
  lateFeesPortion?: number;
  depositPortion?: number;
  otherPortion?: number;
  receiptNumber?: string;
  notes?: string;
}

export interface UpdateRentPaymentDto {
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  rentPortion?: number;
  lateFeesPortion?: number;
  depositPortion?: number;
  otherPortion?: number;
  status?: RentPaymentStatus;
  notes?: string;
}

export interface RentPaymentListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  leaseId?: string;
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: PaymentMethod;
  status?: RentPaymentStatus;
}

export interface ArrearsReportEntry {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  propertyName: string;
  unitName?: string;
  leaseCode: string;
  totalDue: number;
  totalPaid: number;
  arrearsAmount: number;
  daysPastDue: number;
  oldestOverdueDate: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class RentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: CreateRentPaymentDto, userId?: string) {
    // Validate tenant
    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${dto.tenantId} not found`);
    }

    // Validate lease
    const lease = await this.prisma.lease.findUnique({
      where: { id: dto.leaseId },
      include: { tenant: true, property: true },
    });
    if (!lease) {
      throw new NotFoundException(`Lease with ID ${dto.leaseId} not found`);
    }
    if (lease.tenantId !== dto.tenantId) {
      throw new BadRequestException('Lease does not belong to the specified tenant');
    }

    // Validate rent schedule if provided
    if (dto.rentScheduleId) {
      const schedule = await this.prisma.rentSchedule.findUnique({
        where: { id: dto.rentScheduleId },
      });
      if (!schedule) {
        throw new NotFoundException(`Rent schedule with ID ${dto.rentScheduleId} not found`);
      }
      if (schedule.leaseId !== dto.leaseId) {
        throw new BadRequestException('Rent schedule does not belong to the specified lease');
      }
    }

    // Generate payment code
    const count = await this.prisma.rentPayment.count();
    const paymentCode = `PAY-${String(count + 1).padStart(6, '0')}`;

    // Calculate portions if not provided
    let rentPortion = dto.rentPortion ?? dto.amount;
    let lateFeesPortion = dto.lateFeesPortion ?? 0;
    let depositPortion = dto.depositPortion ?? 0;
    let otherPortion = dto.otherPortion ?? 0;

    // If only amount provided, allocate to rent
    if (!dto.rentPortion && !dto.lateFeesPortion && !dto.depositPortion && !dto.otherPortion) {
      rentPortion = dto.amount;
    }

    const payment = await this.prisma.rentPayment.create({
      data: {
        paymentCode,
        tenantId: dto.tenantId,
        leaseId: dto.leaseId,
        rentScheduleId: dto.rentScheduleId,
        paymentDate: dto.paymentDate,
        amount: new Prisma.Decimal(dto.amount),
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        rentPortion: new Prisma.Decimal(rentPortion),
        lateFeesPortion: new Prisma.Decimal(lateFeesPortion),
        depositPortion: new Prisma.Decimal(depositPortion),
        otherPortion: new Prisma.Decimal(otherPortion),
        status: RentPaymentStatus.PAID,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
        receivedById: userId,
      },
      include: {
        tenant: true,
        lease: {
          include: { property: true, unit: true },
        },
        rentSchedule: true,
      },
    });

    // Update rent schedule if specified
    if (dto.rentScheduleId) {
      await this.updateRentSchedulePayment(dto.rentScheduleId, dto.amount);
    } else {
      // Auto-allocate to oldest unpaid schedules
      await this.autoAllocatePayment(dto.leaseId, dto.amount);
    }

    // Update tenant balance
    await this.prisma.tenant.update({
      where: { id: dto.tenantId },
      data: {
        currentBalance: { increment: dto.amount },
      },
    });

    // Update tenant status if was LATE
    if (tenant.status === TenantStatus.LATE) {
      const hasArrears = await this.checkTenantHasArrears(dto.tenantId);
      if (!hasArrears) {
        await this.prisma.tenant.update({
          where: { id: dto.tenantId },
          data: { status: TenantStatus.ACTIVE },
        });
      }
    }

    return payment;
  }

  async findAllPayments(params: RentPaymentListParams = {}) {
    const {
      page = 1,
      limit = 20,
      tenantId,
      leaseId,
      propertyId,
      startDate,
      endDate,
      paymentMethod,
      status,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.RentPaymentWhereInput = {};

    if (tenantId) where.tenantId = tenantId;
    if (leaseId) where.leaseId = leaseId;
    if (propertyId) where.lease = { propertyId };
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = startDate;
      if (endDate) where.paymentDate.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.rentPayment.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              tenantCode: true,
              firstName: true,
              lastName: true,
              companyName: true,
              isCompany: true,
            },
          },
          lease: {
            include: {
              property: { select: { id: true, name: true, propertyCode: true } },
              unit: { select: { id: true, name: true, unitCode: true } },
            },
          },
          rentSchedule: true,
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.rentPayment.count({ where }),
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

  async findPaymentById(id: string) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
      include: {
        tenant: true,
        lease: {
          include: { property: true, unit: true },
        },
        rentSchedule: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async updatePayment(id: string, dto: UpdateRentPaymentDto) {
    await this.findPaymentById(id);

    const updateData: Prisma.RentPaymentUpdateInput = {};

    // Assign simple fields explicitly
    if (dto.paymentDate !== undefined) updateData.paymentDate = dto.paymentDate;
    if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
    if (dto.referenceNumber !== undefined) updateData.referenceNumber = dto.referenceNumber;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Assign decimal fields explicitly
    if (dto.amount !== undefined) updateData.amount = new Prisma.Decimal(dto.amount);
    if (dto.rentPortion !== undefined) updateData.rentPortion = new Prisma.Decimal(dto.rentPortion);
    if (dto.lateFeesPortion !== undefined) updateData.lateFeesPortion = new Prisma.Decimal(dto.lateFeesPortion);
    if (dto.depositPortion !== undefined) updateData.depositPortion = new Prisma.Decimal(dto.depositPortion);
    if (dto.otherPortion !== undefined) updateData.otherPortion = new Prisma.Decimal(dto.otherPortion);

    return this.prisma.rentPayment.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
        lease: true,
      },
    });
  }

  async refundPayment(id: string, reason: string) {
    const payment = await this.findPaymentById(id);

    if (payment.status === RentPaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment already refunded');
    }

    // Create refund record
    const count = await this.prisma.rentPayment.count();
    const refundCode = `PAY-${String(count + 1).padStart(6, '0')}`;

    const refund = await this.prisma.rentPayment.create({
      data: {
        paymentCode: refundCode,
        tenantId: payment.tenantId,
        leaseId: payment.leaseId,
        rentScheduleId: payment.rentScheduleId,
        paymentDate: new Date(),
        amount: payment.amount.negated(),
        paymentMethod: payment.paymentMethod,
        referenceNumber: `REFUND-${payment.paymentCode}`,
        rentPortion: payment.rentPortion.negated(),
        lateFeesPortion: payment.lateFeesPortion.negated(),
        depositPortion: payment.depositPortion.negated(),
        otherPortion: payment.otherPortion.negated(),
        status: RentPaymentStatus.REFUNDED,
        isRefund: true,
        notes: reason,
      },
    });

    // Update original payment status
    await this.prisma.rentPayment.update({
      where: { id },
      data: { status: RentPaymentStatus.REFUNDED },
    });

    // Update rent schedule
    if (payment.rentScheduleId) {
      await this.updateRentSchedulePayment(payment.rentScheduleId, -payment.amount.toNumber());
    }

    // Update tenant balance
    await this.prisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        currentBalance: { decrement: payment.amount.toNumber() },
      },
    });

    return refund;
  }

  // --------------------------------------------------------------------------
  // RENT SCHEDULE MANAGEMENT
  // --------------------------------------------------------------------------

  async updateRentSchedulePayment(scheduleId: string, paymentAmount: number) {
    const schedule = await this.prisma.rentSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) return;

    const newAmountPaid = schedule.amountPaid.toNumber() + paymentAmount;
    const newBalance = schedule.totalDue.toNumber() - newAmountPaid;

    let newStatus: RentPaymentStatus;
    if (newBalance <= 0) {
      newStatus = RentPaymentStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = RentPaymentStatus.PARTIAL;
    } else if (new Date() > schedule.dueDate) {
      newStatus = RentPaymentStatus.OVERDUE;
    } else {
      newStatus = RentPaymentStatus.PENDING;
    }

    await this.prisma.rentSchedule.update({
      where: { id: scheduleId },
      data: {
        amountPaid: new Prisma.Decimal(newAmountPaid),
        balance: new Prisma.Decimal(Math.max(0, newBalance)),
        status: newStatus,
      },
    });
  }

  async autoAllocatePayment(leaseId: string, amount: number) {
    // Get all unpaid schedules ordered by due date
    const schedules = await this.prisma.rentSchedule.findMany({
      where: {
        leaseId,
        status: { in: [RentPaymentStatus.PENDING, RentPaymentStatus.PARTIAL, RentPaymentStatus.OVERDUE] },
      },
      orderBy: { dueDate: 'asc' },
    });

    let remaining = amount;

    for (const schedule of schedules) {
      if (remaining <= 0) break;

      const balance = schedule.balance.toNumber();
      const allocation = Math.min(remaining, balance);

      await this.updateRentSchedulePayment(schedule.id, allocation);
      remaining -= allocation;
    }

    return remaining; // Any excess
  }

  async applyLateFees() {
    const today = new Date();

    // Find overdue schedules without late fees
    const overdueSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        status: { in: [RentPaymentStatus.PENDING, RentPaymentStatus.PARTIAL] },
        dueDate: { lt: today },
        lateFeeApplied: new Prisma.Decimal(0),
      },
      include: {
        lease: true,
      },
    });

    const updates: { scheduleId: string; lateFee: number }[] = [];

    for (const schedule of overdueSchedules) {
      const { lease } = schedule;
      const daysPastDue = Math.floor((today.getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= (lease.gracePeriodDays || 5)) continue;

      let lateFee = 0;
      if (lease.lateFeeAmount) {
        lateFee = lease.lateFeeAmount.toNumber();
      } else if (lease.lateFeePercentage) {
        lateFee = schedule.rentAmount.toNumber() * (lease.lateFeePercentage.toNumber() / 100);
      }

      if (lateFee > 0) {
        updates.push({ scheduleId: schedule.id, lateFee });
      }
    }

    // Apply late fees
    for (const update of updates) {
      const schedule = overdueSchedules.find(s => s.id === update.scheduleId)!;

      await this.prisma.rentSchedule.update({
        where: { id: update.scheduleId },
        data: {
          lateFeeApplied: new Prisma.Decimal(update.lateFee),
          totalDue: { increment: update.lateFee },
          balance: { increment: update.lateFee },
          status: RentPaymentStatus.OVERDUE,
        },
      });

      // Update tenant balance
      await this.prisma.tenant.update({
        where: { id: schedule.lease.tenantId },
        data: {
          currentBalance: { decrement: update.lateFee },
          status: TenantStatus.LATE,
        },
      });
    }

    return updates.length;
  }

  // --------------------------------------------------------------------------
  // ARREARS REPORT
  // --------------------------------------------------------------------------

  async getArrearsReport(): Promise<ArrearsReportEntry[]> {
    const overdueSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        status: { in: [RentPaymentStatus.OVERDUE, RentPaymentStatus.PARTIAL] },
        balance: { gt: 0 },
      },
      include: {
        lease: {
          include: {
            tenant: true,
            property: true,
            unit: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Group by tenant/lease
    const arrearsMap = new Map<string, ArrearsReportEntry>();

    for (const schedule of overdueSchedules) {
      const key = `${schedule.lease.tenantId}-${schedule.leaseId}`;
      const tenant = schedule.lease.tenant;
      const tenantName = tenant.isCompany
        ? tenant.companyName || ''
        : `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();

      const daysPastDue = Math.floor(
        (new Date().getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (arrearsMap.has(key)) {
        const entry = arrearsMap.get(key)!;
        entry.totalDue += schedule.totalDue.toNumber();
        entry.totalPaid += schedule.amountPaid.toNumber();
        entry.arrearsAmount += schedule.balance.toNumber();
        if (daysPastDue > entry.daysPastDue) {
          entry.daysPastDue = daysPastDue;
        }
        if (schedule.dueDate < entry.oldestOverdueDate) {
          entry.oldestOverdueDate = schedule.dueDate;
        }
      } else {
        arrearsMap.set(key, {
          tenantId: tenant.id,
          tenantName,
          tenantCode: tenant.tenantCode,
          propertyName: schedule.lease.property.name,
          unitName: schedule.lease.unit?.name,
          leaseCode: schedule.lease.leaseCode,
          totalDue: schedule.totalDue.toNumber(),
          totalPaid: schedule.amountPaid.toNumber(),
          arrearsAmount: schedule.balance.toNumber(),
          daysPastDue,
          oldestOverdueDate: schedule.dueDate,
        });
      }
    }

    return Array.from(arrearsMap.values()).sort((a, b) => b.arrearsAmount - a.arrearsAmount);
  }

  // --------------------------------------------------------------------------
  // COLLECTION STATISTICS
  // --------------------------------------------------------------------------

  async getCollectionStatistics(params: { startDate?: Date; endDate?: Date; propertyId?: string } = {}) {
    const { startDate, endDate, propertyId } = params;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const scheduleWhere: Prisma.RentScheduleWhereInput = {};
    if (startDate || endDate) {
      scheduleWhere.dueDate = dateFilter;
    }
    if (propertyId) {
      scheduleWhere.lease = { propertyId };
    }

    const paymentWhere: Prisma.RentPaymentWhereInput = {};
    if (startDate || endDate) {
      paymentWhere.paymentDate = dateFilter;
    }
    if (propertyId) {
      paymentWhere.lease = { propertyId };
    }

    const [
      totalBilledResult,
      totalCollectedResult,
      overdueCount,
      paymentsByMethod,
    ] = await Promise.all([
      this.prisma.rentSchedule.aggregate({
        where: scheduleWhere,
        _sum: { totalDue: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: {
          ...paymentWhere,
          status: { not: RentPaymentStatus.REFUNDED },
        },
        _sum: { amount: true },
      }),
      this.prisma.rentSchedule.count({
        where: {
          ...scheduleWhere,
          status: RentPaymentStatus.OVERDUE,
        },
      }),
      this.prisma.rentPayment.groupBy({
        by: ['paymentMethod'],
        where: {
          ...paymentWhere,
          status: { not: RentPaymentStatus.REFUNDED },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalBilled = totalBilledResult._sum.totalDue?.toNumber() || 0;
    const totalCollected = totalCollectedResult._sum.amount?.toNumber() || 0;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    const byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }> = {} as any;
    for (const pm of Object.values(PaymentMethod)) {
      byPaymentMethod[pm] = { count: 0, amount: 0 };
    }
    for (const item of paymentsByMethod) {
      byPaymentMethod[item.paymentMethod] = {
        count: item._count,
        amount: item._sum.amount?.toNumber() || 0,
      };
    }

    return {
      totalBilled,
      totalCollected,
      outstanding: totalBilled - totalCollected,
      collectionRate: Math.round(collectionRate * 100) / 100,
      overdueCount,
      byPaymentMethod,
    };
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private async checkTenantHasArrears(tenantId: string): Promise<boolean> {
    const overdueCount = await this.prisma.rentSchedule.count({
      where: {
        lease: { tenantId, isActive: true },
        status: { in: [RentPaymentStatus.OVERDUE, RentPaymentStatus.PARTIAL] },
        balance: { gt: 0 },
      },
    });

    return overdueCount > 0;
  }
}
