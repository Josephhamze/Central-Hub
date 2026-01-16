import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  LeaseType,
  PaymentFrequency,
  PaymentMethod,
  PropertyStatus,
  TenantStatus,
  RentPaymentStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLeaseDto {
  tenantId: string;
  propertyId: string;
  unitId?: string;
  leaseType: LeaseType;
  startDate: Date;
  endDate?: Date;
  signedDate?: Date;
  rentAmount: number;
  depositAmount?: number;
  paymentFrequency: PaymentFrequency;
  paymentDueDay?: number;
  gracePeriodDays?: number;
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  currency?: string;
  hasEscalation?: boolean;
  escalationPct?: number;
  escalationDate?: Date;
  preferredPaymentMethod?: PaymentMethod;
  utilitiesIncluded?: string[];
  contractDocumentUrl?: string;
  specialTerms?: string;
  notes?: string;
}

export interface UpdateLeaseDto extends Partial<Omit<CreateLeaseDto, 'tenantId' | 'propertyId' | 'unitId'>> {
  isActive?: boolean;
  terminationReason?: string;
}

export interface LeaseListParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  tenantId?: string;
  isActive?: boolean;
  leaseType?: LeaseType;
  expiringWithinDays?: number;
}

export interface RentRollEntry {
  leaseId: string;
  leaseCode: string;
  tenantName: string;
  propertyName: string;
  unitName?: string;
  rentAmount: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
  balance: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LeaseService {
  constructor(private prisma: PrismaService) {}

  async createLease(dto: CreateLeaseDto, userId?: string) {
    // Validate tenant exists and is not blacklisted
    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${dto.tenantId} not found`);
    }
    if (tenant.status === TenantStatus.BLACKLISTED) {
      throw new BadRequestException('Cannot create lease for blacklisted tenant');
    }

    // Validate property exists
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found`);
    }

    // Validate unit if provided
    if (dto.unitId) {
      const unit = await this.prisma.propertyUnit.findUnique({ where: { id: dto.unitId } });
      if (!unit) {
        throw new NotFoundException(`Property unit with ID ${dto.unitId} not found`);
      }
      if (unit.propertyId !== dto.propertyId) {
        throw new BadRequestException('Unit does not belong to the specified property');
      }

      // Check for existing active lease on this unit
      const existingLease = await this.prisma.lease.findFirst({
        where: {
          unitId: dto.unitId,
          isActive: true,
        },
      });
      if (existingLease) {
        throw new BadRequestException('Unit already has an active lease');
      }
    } else {
      // Check for existing active lease on property (if single-unit property)
      const existingLease = await this.prisma.lease.findFirst({
        where: {
          propertyId: dto.propertyId,
          unitId: null,
          isActive: true,
        },
      });
      if (existingLease) {
        throw new BadRequestException('Property already has an active lease');
      }
    }

    // Generate lease code
    const count = await this.prisma.lease.count();
    const leaseCode = `LSE-${String(count + 1).padStart(5, '0')}`;

    // Calculate next escalation date if escalation is enabled
    let nextEscalationDate: Date | null = null;
    if (dto.hasEscalation && dto.escalationDate) {
      nextEscalationDate = dto.escalationDate;
    } else if (dto.hasEscalation) {
      // Default to one year from start date
      nextEscalationDate = new Date(dto.startDate);
      nextEscalationDate.setFullYear(nextEscalationDate.getFullYear() + 1);
    }

    const lease = await this.prisma.lease.create({
      data: {
        leaseCode,
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        leaseType: dto.leaseType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        signedDate: dto.signedDate,
        rentAmount: new Prisma.Decimal(dto.rentAmount),
        depositAmount: dto.depositAmount ? new Prisma.Decimal(dto.depositAmount) : new Prisma.Decimal(0),
        paymentFrequency: dto.paymentFrequency,
        paymentDueDay: dto.paymentDueDay ?? 1,
        gracePeriodDays: dto.gracePeriodDays ?? 5,
        lateFeeAmount: dto.lateFeeAmount ? new Prisma.Decimal(dto.lateFeeAmount) : null,
        lateFeePercentage: dto.lateFeePercentage ? new Prisma.Decimal(dto.lateFeePercentage) : null,
        currency: dto.currency ?? 'USD',
        hasEscalation: dto.hasEscalation ?? false,
        escalationPct: dto.escalationPct ? new Prisma.Decimal(dto.escalationPct) : null,
        escalationDate: dto.escalationDate,
        nextEscalationDate,
        preferredPaymentMethod: dto.preferredPaymentMethod,
        utilitiesIncluded: dto.utilitiesIncluded,
        contractDocumentUrl: dto.contractDocumentUrl,
        specialTerms: dto.specialTerms,
        notes: dto.notes,
        isActive: true,
        createdById: userId,
      },
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
    });

    // Update property/unit status to OCCUPIED
    if (dto.unitId) {
      await this.prisma.propertyUnit.update({
        where: { id: dto.unitId },
        data: { status: PropertyStatus.OCCUPIED },
      });
    }

    // Update property status if no units or single unit property
    const propertyUnits = await this.prisma.propertyUnit.count({ where: { propertyId: dto.propertyId } });
    if (propertyUnits === 0) {
      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: PropertyStatus.OCCUPIED },
      });
    }

    // Activate tenant if pending
    if (tenant.status === TenantStatus.PENDING) {
      await this.prisma.tenant.update({
        where: { id: dto.tenantId },
        data: { status: TenantStatus.ACTIVE },
      });
    }

    // Generate initial rent schedules
    await this.generateRentSchedules(lease.id, dto.startDate, dto.endDate || this.addMonths(dto.startDate, 12));

    return lease;
  }

  async findAllLeases(params: LeaseListParams = {}) {
    const { page = 1, limit = 20, propertyId, tenantId, isActive, leaseType, expiringWithinDays } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaseWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (tenantId) where.tenantId = tenantId;
    if (isActive !== undefined) where.isActive = isActive;
    if (leaseType) where.leaseType = leaseType;

    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      where.endDate = {
        gte: new Date(),
        lte: futureDate,
      };
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.lease.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: true,
          property: {
            select: { id: true, name: true, propertyCode: true, city: true },
          },
          unit: {
            select: { id: true, name: true, unitCode: true },
          },
          _count: {
            select: {
              rentPayments: true,
              rentSchedules: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.lease.count({ where }),
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

  async findLeaseById(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: true,
        property: true,
        unit: true,
        rentPayments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        rentSchedules: {
          orderBy: { periodStart: 'desc' },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  async findLeaseByCode(leaseCode: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { leaseCode },
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
    });

    if (!lease) {
      throw new NotFoundException(`Lease with code ${leaseCode} not found`);
    }

    return lease;
  }

  async updateLease(id: string, dto: UpdateLeaseDto) {
    await this.findLeaseById(id);

    const updateData: Prisma.LeaseUpdateInput = {};

    // Assign simple fields explicitly
    if (dto.leaseType !== undefined) updateData.leaseType = dto.leaseType;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
    if (dto.signedDate !== undefined) updateData.signedDate = dto.signedDate;
    if (dto.paymentFrequency !== undefined) updateData.paymentFrequency = dto.paymentFrequency;
    if (dto.paymentDueDay !== undefined) updateData.paymentDueDay = dto.paymentDueDay;
    if (dto.gracePeriodDays !== undefined) updateData.gracePeriodDays = dto.gracePeriodDays;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.hasEscalation !== undefined) updateData.hasEscalation = dto.hasEscalation;
    if (dto.escalationDate !== undefined) updateData.escalationDate = dto.escalationDate;
    if (dto.preferredPaymentMethod !== undefined) updateData.preferredPaymentMethod = dto.preferredPaymentMethod;
    if (dto.utilitiesIncluded !== undefined) updateData.utilitiesIncluded = dto.utilitiesIncluded;
    if (dto.contractDocumentUrl !== undefined) updateData.contractDocumentUrl = dto.contractDocumentUrl;
    if (dto.specialTerms !== undefined) updateData.specialTerms = dto.specialTerms;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.terminationReason !== undefined) updateData.terminationReason = dto.terminationReason;

    // Assign decimal fields explicitly
    if (dto.rentAmount !== undefined) updateData.rentAmount = new Prisma.Decimal(dto.rentAmount);
    if (dto.depositAmount !== undefined) updateData.depositAmount = dto.depositAmount ? new Prisma.Decimal(dto.depositAmount) : null;
    if (dto.lateFeeAmount !== undefined) updateData.lateFeeAmount = dto.lateFeeAmount ? new Prisma.Decimal(dto.lateFeeAmount) : null;
    if (dto.lateFeePercentage !== undefined) updateData.lateFeePercentage = dto.lateFeePercentage ? new Prisma.Decimal(dto.lateFeePercentage) : null;
    if (dto.escalationPct !== undefined) updateData.escalationPct = dto.escalationPct ? new Prisma.Decimal(dto.escalationPct) : null;

    return this.prisma.lease.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
    });
  }

  async terminateLease(id: string, reason: string) {
    const lease = await this.findLeaseById(id);

    if (!lease.isActive) {
      throw new BadRequestException('Lease is already terminated');
    }

    // Update lease
    const updatedLease = await this.prisma.lease.update({
      where: { id },
      data: {
        isActive: false,
        terminatedDate: new Date(),
        terminationReason: reason,
      },
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
    });

    // Update property/unit status
    if (lease.unitId) {
      await this.prisma.propertyUnit.update({
        where: { id: lease.unitId },
        data: { status: PropertyStatus.VACANT },
      });
    } else {
      await this.prisma.property.update({
        where: { id: lease.propertyId },
        data: { status: PropertyStatus.VACANT },
      });
    }

    // Check if tenant has other active leases
    const otherLeases = await this.prisma.lease.count({
      where: {
        tenantId: lease.tenantId,
        isActive: true,
        id: { not: id },
      },
    });

    if (otherLeases === 0) {
      await this.prisma.tenant.update({
        where: { id: lease.tenantId },
        data: { status: TenantStatus.VACATED },
      });
    }

    return updatedLease;
  }

  async renewLease(id: string, newEndDate: Date, newRentAmount?: number) {
    const lease = await this.findLeaseById(id);

    if (!lease.isActive) {
      throw new BadRequestException('Cannot renew terminated lease');
    }

    const oldEndDate = lease.endDate;
    const rentAmount = newRentAmount ?? lease.rentAmount.toNumber();

    // Apply escalation if applicable
    let finalRent = rentAmount;
    if (lease.hasEscalation && lease.escalationPct) {
      finalRent = rentAmount * (1 + lease.escalationPct.toNumber() / 100);
    }

    // Update lease
    const updatedLease = await this.prisma.lease.update({
      where: { id },
      data: {
        endDate: newEndDate,
        rentAmount: new Prisma.Decimal(finalRent),
        nextEscalationDate: lease.hasEscalation
          ? new Date(newEndDate.getFullYear() + 1, newEndDate.getMonth(), newEndDate.getDate())
          : null,
      },
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
    });

    // Generate new rent schedules
    const startDate = oldEndDate ? new Date(oldEndDate.getTime() + 86400000) : new Date();
    await this.generateRentSchedules(id, startDate, newEndDate);

    return updatedLease;
  }

  // --------------------------------------------------------------------------
  // RENT SCHEDULES
  // --------------------------------------------------------------------------

  async generateRentSchedules(leaseId: string, startDate: Date, endDate: Date) {
    const lease = await this.findLeaseById(leaseId);

    const schedules: Prisma.RentScheduleCreateManyInput[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;
      let dueDate: Date;

      switch (lease.paymentFrequency) {
        case PaymentFrequency.WEEKLY:
          periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 6);
          dueDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case PaymentFrequency.BI_WEEKLY:
          periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 13);
          dueDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case PaymentFrequency.MONTHLY:
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(periodEnd.getDate() - 1);
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), lease.paymentDueDay);
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case PaymentFrequency.QUARTERLY:
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 3);
          periodEnd.setDate(periodEnd.getDate() - 1);
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), lease.paymentDueDay);
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case PaymentFrequency.ANNUALLY:
          periodEnd = new Date(currentDate);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          periodEnd.setDate(periodEnd.getDate() - 1);
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), lease.paymentDueDay);
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(periodEnd.getDate() - 1);
          dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), lease.paymentDueDay);
          currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Calculate rent amount based on frequency
      let rentAmount = lease.rentAmount.toNumber();
      if (lease.paymentFrequency === PaymentFrequency.WEEKLY) {
        rentAmount = rentAmount / 4; // Approximate weekly from monthly
      } else if (lease.paymentFrequency === PaymentFrequency.BI_WEEKLY) {
        rentAmount = rentAmount / 2;
      } else if (lease.paymentFrequency === PaymentFrequency.QUARTERLY) {
        rentAmount = rentAmount * 3;
      } else if (lease.paymentFrequency === PaymentFrequency.ANNUALLY) {
        rentAmount = rentAmount * 12;
      }

      schedules.push({
        leaseId,
        periodStart,
        periodEnd,
        dueDate,
        rentAmount: new Prisma.Decimal(rentAmount),
        additionalCharges: new Prisma.Decimal(0),
        totalDue: new Prisma.Decimal(rentAmount),
        amountPaid: new Prisma.Decimal(0),
        balance: new Prisma.Decimal(rentAmount),
        status: RentPaymentStatus.PENDING,
      });
    }

    // Create schedules (skip if already exists for that period)
    for (const schedule of schedules) {
      try {
        await this.prisma.rentSchedule.create({ data: schedule });
      } catch (e) {
        // Unique constraint violation - schedule already exists
        if (e.code !== 'P2002') throw e;
      }
    }

    return schedules.length;
  }

  async getRentSchedules(leaseId: string, params: { status?: RentPaymentStatus; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RentScheduleWhereInput = { leaseId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.rentSchedule.count({ where }),
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

  // --------------------------------------------------------------------------
  // RENT ROLL
  // --------------------------------------------------------------------------

  async getRentRoll(params: { propertyId?: string; asOfDate?: Date } = {}): Promise<RentRollEntry[]> {
    const { propertyId, asOfDate = new Date() } = params;

    const where: Prisma.LeaseWhereInput = {
      isActive: true,
      startDate: { lte: asOfDate },
    };

    if (propertyId) where.propertyId = propertyId;

    const leases = await this.prisma.lease.findMany({
      where,
      include: {
        tenant: true,
        property: true,
        unit: true,
        rentSchedules: {
          where: {
            status: { in: [RentPaymentStatus.PENDING, RentPaymentStatus.PARTIAL, RentPaymentStatus.OVERDUE] },
          },
        },
      },
      orderBy: { property: { name: 'asc' } },
    });

    return leases.map((lease) => {
      const totalBalance = lease.rentSchedules.reduce(
        (sum, schedule) => sum + schedule.balance.toNumber(),
        0
      );

      const tenantName = lease.tenant.isCompany
        ? lease.tenant.companyName || ''
        : `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim();

      return {
        leaseId: lease.id,
        leaseCode: lease.leaseCode,
        tenantName,
        propertyName: lease.property.name,
        unitName: lease.unit?.name,
        rentAmount: lease.rentAmount.toNumber(),
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.isActive ? 'ACTIVE' : 'TERMINATED',
        balance: totalBalance,
      };
    });
  }

  // --------------------------------------------------------------------------
  // EXPIRING LEASES
  // --------------------------------------------------------------------------

  async getExpiringLeases(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.lease.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        tenant: true,
        property: true,
        unit: true,
      },
      orderBy: { endDate: 'asc' },
    });
  }

  // --------------------------------------------------------------------------
  // LEASE STATISTICS
  // --------------------------------------------------------------------------

  async getLeaseStatistics() {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const [
      totalActive,
      totalInactive,
      byType,
      expiring30,
      expiring60,
      expiring90,
      avgDuration,
    ] = await Promise.all([
      this.prisma.lease.count({ where: { isActive: true } }),
      this.prisma.lease.count({ where: { isActive: false } }),
      this.prisma.lease.groupBy({
        by: ['leaseType'],
        where: { isActive: true },
        _count: true,
      }),
      this.prisma.lease.count({
        where: {
          isActive: true,
          endDate: { gte: now, lte: thirtyDays },
        },
      }),
      this.prisma.lease.count({
        where: {
          isActive: true,
          endDate: { gte: now, lte: sixtyDays },
        },
      }),
      this.prisma.lease.count({
        where: {
          isActive: true,
          endDate: { gte: now, lte: ninetyDays },
        },
      }),
      this.prisma.lease.aggregate({
        where: { isActive: true, endDate: { not: null } },
        _avg: {
          // We'll calculate duration separately
        },
      }),
    ]);

    // Calculate average lease duration
    const leasesWithDuration = await this.prisma.lease.findMany({
      where: { isActive: true, endDate: { not: null } },
      select: { startDate: true, endDate: true },
    });

    let totalDuration = 0;
    for (const lease of leasesWithDuration) {
      if (lease.endDate) {
        const duration = (lease.endDate.getTime() - lease.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalDuration += duration;
      }
    }
    const avgLeaseDurationMonths = leasesWithDuration.length > 0
      ? totalDuration / leasesWithDuration.length
      : 0;

    const typeCounts: Record<LeaseType, number> = {
      [LeaseType.FIXED]: 0,
      [LeaseType.MONTH_TO_MONTH]: 0,
      [LeaseType.YEARLY]: 0,
    };

    for (const item of byType) {
      typeCounts[item.leaseType] = item._count;
    }

    return {
      totalActive,
      totalInactive,
      byType: typeCounts,
      expiring30,
      expiring60,
      expiring90,
      avgLeaseDurationMonths: Math.round(avgLeaseDurationMonths * 10) / 10,
    };
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
}
