import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, status?: AssetStatus) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { manufacturer: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          project: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          _count: {
            select: {
              workOrders: true,
              maintenanceSchedules: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
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
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        project: true,
        warehouse: true,
        maintenanceSchedules: {
          where: { isActive: true },
          orderBy: { nextDueAt: 'asc' },
        },
        workOrders: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            actor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        depreciationProfile: {
          include: {
            entries: {
              orderBy: { period: 'desc' },
              take: 12,
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async create(dto: CreateAssetDto, actorUserId: string) {
    // Check if assetTag already exists
    const existing = await this.prisma.asset.findUnique({
      where: { assetTag: dto.assetTag },
    });

    if (existing) {
      throw new BadRequestException('Asset tag already exists');
    }

    // Validate project/warehouse if provided
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!project) {
        throw new BadRequestException('Project not found');
      }
    }

    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!warehouse) {
        throw new BadRequestException('Warehouse not found');
      }
    }

    const asset = await this.prisma.asset.create({
      data: {
        assetTag: dto.assetTag,
        name: dto.name,
        category: dto.category,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: dto.acquisitionCost,
        currentValue: dto.currentValue,
        status: dto.status || AssetStatus.OPERATIONAL,
        location: dto.location,
        projectId: dto.projectId,
        warehouseId: dto.warehouseId,
        assignedTo: dto.assignedTo,
        criticality: dto.criticality || 'MEDIUM',
        expectedLifeYears: dto.expectedLifeYears,
        notes: dto.notes,
        history: {
          create: {
            eventType: 'CREATED',
            actorUserId,
            metadataJson: {
              assetTag: dto.assetTag,
              name: dto.name,
              category: dto.category,
            },
          },
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    return asset;
  }

  async update(id: string, dto: UpdateAssetDto, actorUserId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status === AssetStatus.RETIRED) {
      throw new BadRequestException('Cannot update retired assets');
    }

    // Check assetTag uniqueness if changing
    if (dto.assetTag && dto.assetTag !== asset.assetTag) {
      const existing = await this.prisma.asset.findUnique({
        where: { assetTag: dto.assetTag },
      });
      if (existing) {
        throw new BadRequestException('Asset tag already exists');
      }
    }

    const oldStatus = asset.status;
    const updateData: any = {};

    if (dto.assetTag) updateData.assetTag = dto.assetTag;
    if (dto.name) updateData.name = dto.name;
    if (dto.category) updateData.category = dto.category;
    if (dto.manufacturer !== undefined) updateData.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;
    if (dto.acquisitionDate) updateData.acquisitionDate = new Date(dto.acquisitionDate);
    if (dto.acquisitionCost !== undefined) updateData.acquisitionCost = dto.acquisitionCost;
    if (dto.currentValue !== undefined) updateData.currentValue = dto.currentValue;
    if (dto.status) updateData.status = dto.status;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
    if (dto.criticality) updateData.criticality = dto.criticality;
    if (dto.expectedLifeYears !== undefined) updateData.expectedLifeYears = dto.expectedLifeYears;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      // Log status change if status changed
      if (dto.status && dto.status !== oldStatus) {
        await tx.assetHistory.create({
          data: {
            assetId: id,
            eventType: 'STATUS_CHANGED',
            actorUserId,
            metadataJson: {
              oldStatus,
              newStatus: dto.status,
            },
          },
        });
      }

      return asset;
    });

    return updated;
  }

  async retire(id: string, actorUserId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        workOrders: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status === AssetStatus.RETIRED) {
      throw new BadRequestException('Asset is already retired');
    }

    if (asset.workOrders.length > 0) {
      throw new BadRequestException('Cannot retire asset with open work orders');
    }

    const retired = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: { status: AssetStatus.RETIRED },
        include: {
          project: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      await tx.assetHistory.create({
        data: {
          assetId: id,
          eventType: 'RETIRED',
          actorUserId,
          metadataJson: {
            retiredAt: new Date().toISOString(),
          },
        },
      });

      return asset;
    });

    return retired;
  }

  async getHistory(id: string, page = 1, limit = 50) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 50);
    const skip = (pageNum - 1) * limitNum;

    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const [items, total] = await Promise.all([
      this.prisma.assetHistory.findMany({
        where: { assetId: id },
        skip,
        take: limitNum,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assetHistory.count({ where: { assetId: id } }),
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

  async getOverview() {
    const [
      totalAssets,
      operationalAssets,
      maintenanceAssets,
      brokenAssets,
      overdueMaintenance,
      openWorkOrders,
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'OPERATIONAL' } }),
      this.prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.asset.count({ where: { status: 'BROKEN' } }),
      this.prisma.maintenanceSchedule.count({
        where: {
          isActive: true,
          nextDueAt: { lte: new Date() },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
      }),
    ]);

    return {
      totalAssets,
      operationalAssets,
      maintenanceAssets,
      brokenAssets,
      overdueMaintenance,
      openWorkOrders,
    };
  }
}
