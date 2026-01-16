import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ExpenseCategory,
  MaintenancePriority,
  MaintenanceStatus,
  PropertyStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateMaintenanceJobDto {
  propertyId: string;
  unitId?: string;
  workOrderId?: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  priority?: MaintenancePriority;
  reportedDate: Date;
  scheduledDate?: Date;
  assignedTo?: string;
  contractorId?: string;
  estimatedCost?: number;
  currency?: string;
  budgetCode?: string;
  affectsOccupancy?: boolean;
  vacancyDaysImpact?: number;
  reportedByTenantId?: string;
  tenantAccessRequired?: boolean;
  notes?: string;
}

export interface UpdateMaintenanceJobDto extends Partial<CreateMaintenanceJobDto> {
  status?: MaintenanceStatus;
  startedDate?: Date;
  completedDate?: Date;
  actualCost?: number;
  resolutionNotes?: string;
  beforePhotosJson?: string[];
  afterPhotosJson?: string[];
  invoiceUrl?: string;
}

export interface MaintenanceJobListParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  unitId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: ExpenseCategory;
  assignedTo?: string;
}

export interface MaintenanceSummary {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  byPriority: Record<MaintenancePriority, number>;
  byStatus: Record<MaintenanceStatus, number>;
  byCategory: Record<ExpenseCategory, number>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async createJob(dto: CreateMaintenanceJobDto, userId?: string) {
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

    // Generate job code
    const count = await this.prisma.propertyMaintenanceJob.count();
    const jobCode = `MNT-${String(count + 1).padStart(6, '0')}`;

    const job = await this.prisma.propertyMaintenanceJob.create({
      data: {
        jobCode,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        workOrderId: dto.workOrderId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority ?? MaintenancePriority.MEDIUM,
        status: MaintenanceStatus.PENDING,
        reportedDate: dto.reportedDate,
        scheduledDate: dto.scheduledDate,
        assignedTo: dto.assignedTo,
        contractorId: dto.contractorId,
        estimatedCost: dto.estimatedCost ? new Prisma.Decimal(dto.estimatedCost) : null,
        currency: dto.currency ?? 'USD',
        budgetCode: dto.budgetCode,
        affectsOccupancy: dto.affectsOccupancy ?? false,
        vacancyDaysImpact: dto.vacancyDaysImpact,
        reportedByTenantId: dto.reportedByTenantId,
        tenantAccessRequired: dto.tenantAccessRequired ?? false,
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

    // Update property/unit status if affects occupancy
    if (dto.affectsOccupancy) {
      if (dto.unitId) {
        await this.prisma.propertyUnit.update({
          where: { id: dto.unitId },
          data: { status: PropertyStatus.UNDER_MAINTENANCE },
        });
      } else {
        await this.prisma.property.update({
          where: { id: dto.propertyId },
          data: { status: PropertyStatus.UNDER_MAINTENANCE },
        });
      }
    }

    return job;
  }

  async findAllJobs(params: MaintenanceJobListParams = {}) {
    const {
      page = 1,
      limit = 20,
      propertyId,
      unitId,
      status,
      priority,
      category,
      assignedTo,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.PropertyMaintenanceJobWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = { contains: assignedTo, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.propertyMaintenanceJob.findMany({
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
        orderBy: [
          { priority: 'desc' },
          { reportedDate: 'desc' },
        ],
      }),
      this.prisma.propertyMaintenanceJob.count({ where }),
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

  async findJobById(id: string) {
    const job = await this.prisma.propertyMaintenanceJob.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Maintenance job with ID ${id} not found`);
    }

    return job;
  }

  async updateJob(id: string, dto: UpdateMaintenanceJobDto) {
    const job = await this.findJobById(id);

    const updateData: Prisma.PropertyMaintenanceJobUpdateInput = {};

    const simpleFields = [
      'title', 'description', 'category', 'priority', 'status',
      'scheduledDate', 'startedDate', 'completedDate', 'assignedTo',
      'contractorId', 'currency', 'budgetCode', 'affectsOccupancy',
      'vacancyDaysImpact', 'tenantAccessRequired', 'notes', 'resolutionNotes',
      'beforePhotosJson', 'afterPhotosJson', 'invoiceUrl',
    ];

    for (const field of simpleFields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    if (dto.estimatedCost !== undefined) {
      updateData.estimatedCost = new Prisma.Decimal(dto.estimatedCost);
    }
    if (dto.actualCost !== undefined) {
      updateData.actualCost = new Prisma.Decimal(dto.actualCost);
    }

    const updatedJob = await this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        unit: true,
      },
    });

    // Handle status changes
    if (dto.status === MaintenanceStatus.COMPLETED && job.affectsOccupancy) {
      // Check if property/unit should return to VACANT
      if (job.unitId) {
        const hasActiveLease = await this.prisma.lease.count({
          where: { unitId: job.unitId, isActive: true },
        });
        await this.prisma.propertyUnit.update({
          where: { id: job.unitId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      } else {
        const hasActiveLease = await this.prisma.lease.count({
          where: { propertyId: job.propertyId, unitId: null, isActive: true },
        });
        await this.prisma.property.update({
          where: { id: job.propertyId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      }
    }

    return updatedJob;
  }

  async deleteJob(id: string) {
    await this.findJobById(id);
    await this.prisma.propertyMaintenanceJob.delete({ where: { id } });
    return { deleted: true };
  }

  // --------------------------------------------------------------------------
  // STATUS TRANSITIONS
  // --------------------------------------------------------------------------

  async scheduleJob(id: string, scheduledDate: Date, assignedTo: string) {
    await this.findJobById(id);

    return this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate,
        assignedTo,
      },
    });
  }

  async startJob(id: string) {
    await this.findJobById(id);

    return this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
        startedDate: new Date(),
      },
    });
  }

  async completeJob(id: string, actualCost: number, resolutionNotes?: string) {
    const job = await this.findJobById(id);

    const updatedJob = await this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date(),
        actualCost: new Prisma.Decimal(actualCost),
        resolutionNotes,
      },
    });

    // Restore property/unit status if it was affected
    if (job.affectsOccupancy) {
      if (job.unitId) {
        const hasActiveLease = await this.prisma.lease.count({
          where: { unitId: job.unitId, isActive: true },
        });
        await this.prisma.propertyUnit.update({
          where: { id: job.unitId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      } else {
        const hasActiveLease = await this.prisma.lease.count({
          where: { propertyId: job.propertyId, unitId: null, isActive: true },
        });
        await this.prisma.property.update({
          where: { id: job.propertyId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      }
    }

    return updatedJob;
  }

  async cancelJob(id: string, reason: string) {
    const job = await this.findJobById(id);

    const updatedJob = await this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceStatus.CANCELLED,
        resolutionNotes: reason,
      },
    });

    // Restore property/unit status if it was affected
    if (job.affectsOccupancy && job.status !== MaintenanceStatus.COMPLETED) {
      if (job.unitId) {
        const hasActiveLease = await this.prisma.lease.count({
          where: { unitId: job.unitId, isActive: true },
        });
        await this.prisma.propertyUnit.update({
          where: { id: job.unitId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      } else {
        const hasActiveLease = await this.prisma.lease.count({
          where: { propertyId: job.propertyId, unitId: null, isActive: true },
        });
        await this.prisma.property.update({
          where: { id: job.propertyId },
          data: {
            status: hasActiveLease > 0 ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
          },
        });
      }
    }

    return updatedJob;
  }

  async putOnHold(id: string, reason: string) {
    await this.findJobById(id);

    return this.prisma.propertyMaintenanceJob.update({
      where: { id },
      data: {
        status: MaintenanceStatus.ON_HOLD,
        notes: reason,
      },
    });
  }

  // --------------------------------------------------------------------------
  // MAINTENANCE SUMMARY & REPORTS
  // --------------------------------------------------------------------------

  async getMaintenanceSummary(params: { propertyId?: string; startDate?: Date; endDate?: Date } = {}): Promise<MaintenanceSummary> {
    const { propertyId, startDate, endDate } = params;

    const where: Prisma.PropertyMaintenanceJobWhereInput = {};
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.reportedDate = {};
      if (startDate) where.reportedDate.gte = startDate;
      if (endDate) where.reportedDate.lte = endDate;
    }

    const [
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      estimatedCostResult,
      actualCostResult,
      byPriority,
      byStatus,
      byCategory,
    ] = await Promise.all([
      this.prisma.propertyMaintenanceJob.count({ where }),
      this.prisma.propertyMaintenanceJob.count({ where: { ...where, status: MaintenanceStatus.PENDING } }),
      this.prisma.propertyMaintenanceJob.count({ where: { ...where, status: MaintenanceStatus.IN_PROGRESS } }),
      this.prisma.propertyMaintenanceJob.count({ where: { ...where, status: MaintenanceStatus.COMPLETED } }),
      this.prisma.propertyMaintenanceJob.aggregate({
        where,
        _sum: { estimatedCost: true },
      }),
      this.prisma.propertyMaintenanceJob.aggregate({
        where: { ...where, status: MaintenanceStatus.COMPLETED },
        _sum: { actualCost: true },
      }),
      this.prisma.propertyMaintenanceJob.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      this.prisma.propertyMaintenanceJob.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.propertyMaintenanceJob.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    const priorityCounts: Record<MaintenancePriority, number> = {} as any;
    for (const p of Object.values(MaintenancePriority)) {
      priorityCounts[p] = 0;
    }
    for (const item of byPriority) {
      priorityCounts[item.priority] = item._count;
    }

    const statusCounts: Record<MaintenanceStatus, number> = {} as any;
    for (const s of Object.values(MaintenanceStatus)) {
      statusCounts[s] = 0;
    }
    for (const item of byStatus) {
      statusCounts[item.status] = item._count;
    }

    const categoryCounts: Record<ExpenseCategory, number> = {} as any;
    for (const c of Object.values(ExpenseCategory)) {
      categoryCounts[c] = 0;
    }
    for (const item of byCategory) {
      categoryCounts[item.category] = item._count;
    }

    return {
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      totalEstimatedCost: estimatedCostResult._sum.estimatedCost?.toNumber() || 0,
      totalActualCost: actualCostResult._sum.actualCost?.toNumber() || 0,
      byPriority: priorityCounts,
      byStatus: statusCounts,
      byCategory: categoryCounts,
    };
  }

  async getOpenJobs(propertyId?: string) {
    const where: Prisma.PropertyMaintenanceJobWhereInput = {
      status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.ON_HOLD] },
    };
    if (propertyId) where.propertyId = propertyId;

    return this.prisma.propertyMaintenanceJob.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
        unit: {
          select: { id: true, name: true, unitCode: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { reportedDate: 'asc' },
      ],
    });
  }

  async getUrgentJobs() {
    return this.prisma.propertyMaintenanceJob.findMany({
      where: {
        priority: MaintenancePriority.URGENT,
        status: { notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED] },
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
        unit: {
          select: { id: true, name: true, unitCode: true },
        },
      },
      orderBy: { reportedDate: 'asc' },
    });
  }

  async getMaintenanceCostReport(params: { propertyId?: string; startDate?: Date; endDate?: Date }) {
    const { propertyId, startDate, endDate } = params;

    const where: Prisma.PropertyMaintenanceJobWhereInput = {
      status: MaintenanceStatus.COMPLETED,
    };
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.completedDate = {};
      if (startDate) where.completedDate.gte = startDate;
      if (endDate) where.completedDate.lte = endDate;
    }

    const jobs = await this.prisma.propertyMaintenanceJob.groupBy({
      by: ['propertyId', 'category'],
      where,
      _sum: { actualCost: true, estimatedCost: true },
      _count: true,
    });

    const propertyIds = [...new Set(jobs.map(j => j.propertyId))];
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, name: true, propertyCode: true },
    });
    const propertyMap = new Map(properties.map(p => [p.id, p]));

    // Group by property
    const report = new Map<string, {
      property: any;
      byCategory: Record<ExpenseCategory, { count: number; estimated: number; actual: number }>;
      totals: { count: number; estimated: number; actual: number };
    }>();

    for (const job of jobs) {
      if (!report.has(job.propertyId)) {
        const byCategory: Record<ExpenseCategory, { count: number; estimated: number; actual: number }> = {} as any;
        for (const c of Object.values(ExpenseCategory)) {
          byCategory[c] = { count: 0, estimated: 0, actual: 0 };
        }
        report.set(job.propertyId, {
          property: propertyMap.get(job.propertyId),
          byCategory,
          totals: { count: 0, estimated: 0, actual: 0 },
        });
      }

      const propReport = report.get(job.propertyId)!;
      propReport.byCategory[job.category] = {
        count: job._count,
        estimated: job._sum.estimatedCost?.toNumber() || 0,
        actual: job._sum.actualCost?.toNumber() || 0,
      };
      propReport.totals.count += job._count;
      propReport.totals.estimated += job._sum.estimatedCost?.toNumber() || 0;
      propReport.totals.actual += job._sum.actualCost?.toNumber() || 0;
    }

    return Array.from(report.values());
  }
}
