import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantStatus, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTenantDto {
  isCompany?: boolean;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  idType?: string;
  idNumber?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {
  status?: TenantStatus;
  blacklistReason?: string;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus;
}

export interface TenantLedgerEntry {
  date: Date;
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT' | 'LATE_FEE';
  description: string;
  amount: number;
  balance: number;
  reference?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async createTenant(dto: CreateTenantDto, userId?: string) {
    // Validate: either individual or company info required
    if (!dto.isCompany && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('First name and last name required for individual tenants');
    }
    if (dto.isCompany && !dto.companyName) {
      throw new BadRequestException('Company name required for company tenants');
    }

    // Generate tenant code
    const count = await this.prisma.tenant.count();
    const tenantCode = `TEN-${String(count + 1).padStart(5, '0')}`;

    const tenant = await this.prisma.tenant.create({
      data: {
        tenantCode,
        isCompany: dto.isCompany ?? false,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        idType: dto.idType,
        idNumber: dto.idNumber,
        taxId: dto.taxId,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        notes: dto.notes,
        status: TenantStatus.PENDING,
        currentBalance: new Prisma.Decimal(0),
        createdById: userId,
      },
    });

    return tenant;
  }

  async findAllTenants(params: TenantListParams = {}) {
    const { page = 1, limit = 20, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { tenantCode: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          leases: {
            where: { isActive: true },
            include: {
              property: { select: { id: true, name: true, propertyCode: true } },
              unit: { select: { id: true, name: true, unitCode: true } },
            },
          },
          _count: {
            select: {
              leases: true,
              rentPayments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
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

  async findTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            property: true,
            unit: true,
            rentSchedules: {
              orderBy: { periodStart: 'desc' },
              take: 12,
            },
          },
          orderBy: { startDate: 'desc' },
        },
        rentPayments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            leases: true,
            rentPayments: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findTenantByCode(tenantCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { tenantCode },
      include: {
        leases: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with code ${tenantCode} not found`);
    }

    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    await this.findTenantById(id);

    const updateData: Prisma.TenantUpdateInput = {};

    const fields = [
      'isCompany', 'firstName', 'lastName', 'companyName', 'email', 'phone',
      'alternatePhone', 'idType', 'idNumber', 'taxId', 'addressLine1',
      'addressLine2', 'city', 'state', 'postalCode', 'country',
      'emergencyContactName', 'emergencyContactPhone', 'notes', 'status',
      'blacklistReason',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTenant(id: string) {
    await this.findTenantById(id);

    // Check for active leases
    const activeLeases = await this.prisma.lease.count({
      where: { tenantId: id, isActive: true },
    });

    if (activeLeases > 0) {
      throw new BadRequestException(
        `Cannot delete tenant with ${activeLeases} active lease(s).`
      );
    }

    await this.prisma.tenant.delete({ where: { id } });
    return { deleted: true };
  }

  // --------------------------------------------------------------------------
  // TENANT BALANCE MANAGEMENT
  // --------------------------------------------------------------------------

  async updateTenantBalance(tenantId: string, amount: number) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        currentBalance: { increment: amount },
      },
    });
  }

  async getTenantBalance(tenantId: string): Promise<number> {
    const tenant = await this.findTenantById(tenantId);
    return tenant.currentBalance.toNumber();
  }

  async recalculateTenantBalance(tenantId: string) {
    // Get all rent schedules for active leases
    const schedules = await this.prisma.rentSchedule.findMany({
      where: {
        lease: {
          tenantId,
          isActive: true,
        },
      },
      select: {
        balance: true,
      },
    });

    // Sum all outstanding balances
    const totalBalance = schedules.reduce((sum, s) => sum - s.balance.toNumber(), 0);

    // Update tenant balance (negative = arrears, positive = credit)
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        currentBalance: new Prisma.Decimal(totalBalance),
      },
    });

    return totalBalance;
  }

  // --------------------------------------------------------------------------
  // TENANT LEDGER
  // --------------------------------------------------------------------------

  async getTenantLedger(tenantId: string, params: { startDate?: Date; endDate?: Date } = {}): Promise<TenantLedgerEntry[]> {
    const tenant = await this.findTenantById(tenantId);

    const { startDate, endDate } = params;
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get rent schedules (charges)
    const schedules = await this.prisma.rentSchedule.findMany({
      where: {
        lease: { tenantId },
        ...(startDate || endDate ? { dueDate: dateFilter } : {}),
      },
      include: {
        lease: {
          include: { property: true, unit: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Get payments
    const payments = await this.prisma.rentPayment.findMany({
      where: {
        tenantId,
        ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Combine and sort
    const ledgerEntries: TenantLedgerEntry[] = [];
    let runningBalance = 0;

    // Add charges from schedules
    for (const schedule of schedules) {
      runningBalance += schedule.totalDue.toNumber();
      ledgerEntries.push({
        date: schedule.dueDate,
        type: 'CHARGE',
        description: `Rent for ${schedule.lease.property.name}${schedule.lease.unit ? ' - ' + schedule.lease.unit.name : ''} (${schedule.periodStart.toISOString().split('T')[0]} to ${schedule.periodEnd.toISOString().split('T')[0]})`,
        amount: schedule.totalDue.toNumber(),
        balance: runningBalance,
      });

      // Add late fee if applied
      if (schedule.lateFeeApplied.toNumber() > 0) {
        runningBalance += schedule.lateFeeApplied.toNumber();
        ledgerEntries.push({
          date: schedule.dueDate,
          type: 'LATE_FEE',
          description: 'Late payment fee',
          amount: schedule.lateFeeApplied.toNumber(),
          balance: runningBalance,
        });
      }
    }

    // Add payments
    for (const payment of payments) {
      runningBalance -= payment.amount.toNumber();
      ledgerEntries.push({
        date: payment.paymentDate,
        type: 'PAYMENT',
        description: `Payment received - ${payment.paymentMethod}`,
        amount: -payment.amount.toNumber(),
        balance: runningBalance,
        reference: payment.referenceNumber || payment.receiptNumber,
      });
    }

    // Sort by date
    ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Recalculate running balance
    runningBalance = 0;
    for (const entry of ledgerEntries) {
      runningBalance += entry.amount;
      entry.balance = runningBalance;
    }

    return ledgerEntries;
  }

  // --------------------------------------------------------------------------
  // TENANT STATUS MANAGEMENT
  // --------------------------------------------------------------------------

  async updateTenantStatus(id: string, status: TenantStatus, reason?: string) {
    await this.findTenantById(id);

    const updateData: Prisma.TenantUpdateInput = { status };
    if (status === TenantStatus.BLACKLISTED && reason) {
      updateData.blacklistReason = reason;
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }

  async blacklistTenant(id: string, reason: string) {
    return this.updateTenantStatus(id, TenantStatus.BLACKLISTED, reason);
  }

  async activateTenant(id: string) {
    return this.updateTenantStatus(id, TenantStatus.ACTIVE);
  }

  // --------------------------------------------------------------------------
  // TENANT STATISTICS
  // --------------------------------------------------------------------------

  async getTenantStatistics() {
    const [total, byStatus, tenantsInArrears] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.tenant.count({
        where: {
          currentBalance: { lt: 0 },
        },
      }),
    ]);

    const statusCounts: Record<TenantStatus, number> = {
      [TenantStatus.ACTIVE]: 0,
      [TenantStatus.LATE]: 0,
      [TenantStatus.VACATED]: 0,
      [TenantStatus.BLACKLISTED]: 0,
      [TenantStatus.PENDING]: 0,
    };

    for (const item of byStatus) {
      statusCounts[item.status] = item._count;
    }

    return {
      total,
      byStatus: statusCounts,
      tenantsInArrears,
    };
  }

  // --------------------------------------------------------------------------
  // TENANTS WITH ARREARS
  // --------------------------------------------------------------------------

  async getTenantsInArrears() {
    return this.prisma.tenant.findMany({
      where: {
        currentBalance: { lt: 0 },
      },
      include: {
        leases: {
          where: { isActive: true },
          include: {
            property: true,
            unit: true,
          },
        },
      },
      orderBy: {
        currentBalance: 'asc', // Most arrears first
      },
    });
  }

  async getTenantsWithExpiredLeases() {
    const now = new Date();

    return this.prisma.tenant.findMany({
      where: {
        leases: {
          some: {
            isActive: true,
            endDate: { lt: now },
          },
        },
      },
      include: {
        leases: {
          where: {
            isActive: true,
            endDate: { lt: now },
          },
          include: {
            property: true,
            unit: true,
          },
        },
      },
    });
  }
}
