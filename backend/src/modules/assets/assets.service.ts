import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

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
        { model: { contains: search, mode: 'insensitive' as const } },
        { serialNumber: { contains: search, mode: 'insensitive' as const } },
        { registrationNumber: { contains: search, mode: 'insensitive' as const } },
        { companyCode: { contains: search, mode: 'insensitive' as const } },
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
          company: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          parentAsset: { select: { id: true, name: true, assetTag: true } },
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
        company: { select: { id: true, name: true } },
        project: true,
        warehouse: true,
        parentAsset: { select: { id: true, name: true, assetTag: true } },
        childAssets: { select: { id: true, name: true, assetTag: true } },
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
        // depreciationProfile: {
        //   include: {
        //     entries: {
        //       orderBy: { period: 'desc' },
        //       take: 12,
        //     },
        //   },
        // },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async create(dto: CreateAssetDto, actorUserId: string) {
    // Generate assetTag if not provided (use company code + category + timestamp)
    let assetTag = dto.assetTag;
    if (!assetTag) {
      const timestamp = Date.now().toString().slice(-6);
      const categoryPrefix = dto.category.substring(0, 3).toUpperCase();
      const companyCodePrefix = dto.companyCode ? dto.companyCode.substring(0, 3).toUpperCase() : 'AST';
      assetTag = `${companyCodePrefix}-${categoryPrefix}-${timestamp}`;
    }

    // Check if assetTag already exists
    const existing = await this.prisma.asset.findUnique({
      where: { assetTag },
    });

    if (existing) {
      throw new BadRequestException('Asset tag already exists');
    }

    // Validate required relations
    if (dto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company) {
        throw new BadRequestException('Company not found');
      }
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!project) {
        throw new BadRequestException('Project not found');
      }
    }

    if (dto.parentAssetId) {
      const parentAsset = await this.prisma.asset.findUnique({
        where: { id: dto.parentAssetId },
      });
      if (!parentAsset) {
        throw new BadRequestException('Parent asset not found');
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

    // Validate that either serialNumber or registrationNumber is provided
    if (!dto.serialNumber && !dto.registrationNumber) {
      throw new BadRequestException('Either serial number or registration number is required');
    }

    // Generate family if not provided (category + type)
    const family = dto.family || `${dto.category}-${dto.type}`.toUpperCase();

    const asset = await this.prisma.asset.create({
      data: {
        assetTag,
        name: dto.assetName,
        category: dto.category,
        type: dto.type,
        family: family,
        manufacturer: dto.manufacturer,
        model: dto.model,
        yearModel: dto.yearModel,
        color: dto.color,
        companyId: dto.companyId,
        projectId: dto.projectId,
        companyCode: dto.companyCode,
        countryOfRegistration: dto.countryOfRegistration,
        currentLocation: dto.currentLocation,
        parentAssetId: dto.parentAssetId,
        serialNumber: dto.serialNumber,
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        registrationNumber: dto.registrationNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseValue: dto.purchaseValue ? dto.purchaseValue : null,
        currency: dto.currency || 'USD',
        brandNewValue: dto.brandNewValue ? dto.brandNewValue : null,
        currentMarketValue: dto.currentMarketValue ? dto.currentMarketValue : null,
        residualValue: dto.residualValue ? dto.residualValue : null,
        purchaseOrder: dto.purchaseOrder,
        glAccount: dto.glAccount,
        installDate: dto.installDate ? new Date(dto.installDate) : null,
        endOfLifeDate: dto.endOfLifeDate ? new Date(dto.endOfLifeDate) : null,
        disposalDate: dto.disposalDate ? new Date(dto.disposalDate) : null,
        assetLifecycleStatus: dto.assetLifecycleStatus,
        indexType: dto.indexType,
        currentIndex: dto.currentIndex ? dto.currentIndex : null,
        indexAtPurchase: dto.indexAtPurchase ? dto.indexAtPurchase : null,
        lastIndexDate: dto.lastIndexDate ? new Date(dto.lastIndexDate) : null,
        status: dto.status || AssetStatus.OPERATIONAL,
        statusSince: dto.statusSince ? new Date(dto.statusSince) : new Date(),
        availabilityPercent: dto.availabilityPercent ? dto.availabilityPercent : null,
        lastOperator: dto.lastOperator,
        lastMaintenanceDate: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : null,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        maintenanceBudget: dto.maintenanceBudget ? dto.maintenanceBudget : null,
        // Legacy fields
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : (dto.purchaseDate ? new Date(dto.purchaseDate) : null),
        acquisitionCost: dto.acquisitionCost ? dto.acquisitionCost : (dto.purchaseValue ? dto.purchaseValue : null),
        currentValue: dto.currentValue ? dto.currentValue : (dto.currentMarketValue ? dto.currentMarketValue : null),
        location: dto.location || dto.currentLocation,
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
              assetTag,
              name: dto.assetName,
              category: dto.category,
              type: dto.type,
            },
          },
        },
      },
      include: {
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        parentAsset: { select: { id: true, name: true, assetTag: true } },
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

    // ASSET IDENTITY
    if (dto.assetTag) updateData.assetTag = dto.assetTag;
    if (dto.assetName !== undefined) updateData.name = dto.assetName;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.family !== undefined) updateData.family = dto.family;
    if (dto.manufacturer !== undefined) updateData.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.yearModel !== undefined) updateData.yearModel = dto.yearModel;
    if (dto.color !== undefined) updateData.color = dto.color;

    // ALLOCATION
    if (dto.companyId !== undefined) {
      if (dto.companyId) {
        const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
        if (!company) throw new BadRequestException('Company not found');
      }
      updateData.companyId = dto.companyId;
    }
    if (dto.projectId !== undefined) {
      if (dto.projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
        if (!project) throw new BadRequestException('Project not found');
      }
      updateData.projectId = dto.projectId;
    }
    if (dto.companyCode !== undefined) updateData.companyCode = dto.companyCode;
    if (dto.countryOfRegistration !== undefined) updateData.countryOfRegistration = dto.countryOfRegistration;
    if (dto.currentLocation !== undefined) updateData.currentLocation = dto.currentLocation;
    if (dto.parentAssetId !== undefined) {
      if (dto.parentAssetId) {
        const parentAsset = await this.prisma.asset.findUnique({ where: { id: dto.parentAssetId } });
        if (!parentAsset) throw new BadRequestException('Parent asset not found');
        if (dto.parentAssetId === id) throw new BadRequestException('Asset cannot be its own parent');
      }
      updateData.parentAssetId = dto.parentAssetId;
    }

    // IDENTIFICATION
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;
    if (dto.chassisNumber !== undefined) updateData.chassisNumber = dto.chassisNumber;
    if (dto.engineNumber !== undefined) updateData.engineNumber = dto.engineNumber;
    if (dto.registrationNumber !== undefined) updateData.registrationNumber = dto.registrationNumber;

    // FINANCIAL INFORMATION
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.purchaseValue !== undefined) updateData.purchaseValue = dto.purchaseValue;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.brandNewValue !== undefined) updateData.brandNewValue = dto.brandNewValue;
    if (dto.currentMarketValue !== undefined) updateData.currentMarketValue = dto.currentMarketValue;
    if (dto.residualValue !== undefined) updateData.residualValue = dto.residualValue;
    if (dto.purchaseOrder !== undefined) updateData.purchaseOrder = dto.purchaseOrder;
    if (dto.glAccount !== undefined) updateData.glAccount = dto.glAccount;

    // LIFECYCLE
    if (dto.installDate !== undefined) updateData.installDate = dto.installDate ? new Date(dto.installDate) : null;
    if (dto.endOfLifeDate !== undefined) updateData.endOfLifeDate = dto.endOfLifeDate ? new Date(dto.endOfLifeDate) : null;
    if (dto.disposalDate !== undefined) updateData.disposalDate = dto.disposalDate ? new Date(dto.disposalDate) : null;
    if (dto.assetLifecycleStatus !== undefined) updateData.assetLifecycleStatus = dto.assetLifecycleStatus;

    // INDEX DETAILS
    if (dto.indexType !== undefined) updateData.indexType = dto.indexType;
    if (dto.currentIndex !== undefined) updateData.currentIndex = dto.currentIndex;
    if (dto.indexAtPurchase !== undefined) updateData.indexAtPurchase = dto.indexAtPurchase;
    if (dto.lastIndexDate !== undefined) updateData.lastIndexDate = dto.lastIndexDate ? new Date(dto.lastIndexDate) : null;

    // STATUS
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.statusSince !== undefined) updateData.statusSince = dto.statusSince ? new Date(dto.statusSince) : null;
    if (dto.availabilityPercent !== undefined) updateData.availabilityPercent = dto.availabilityPercent;
    if (dto.lastOperator !== undefined) updateData.lastOperator = dto.lastOperator;

    // MAINTENANCE
    if (dto.lastMaintenanceDate !== undefined) updateData.lastMaintenanceDate = dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : null;
    if (dto.nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null;
    if (dto.maintenanceBudget !== undefined) updateData.maintenanceBudget = dto.maintenanceBudget;

    // Legacy fields
    if (dto.acquisitionDate !== undefined) updateData.acquisitionDate = dto.acquisitionDate ? new Date(dto.acquisitionDate) : null;
    if (dto.acquisitionCost !== undefined) updateData.acquisitionCost = dto.acquisitionCost;
    if (dto.currentValue !== undefined) updateData.currentValue = dto.currentValue;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
    if (dto.criticality !== undefined) updateData.criticality = dto.criticality;
    if (dto.expectedLifeYears !== undefined) updateData.expectedLifeYears = dto.expectedLifeYears;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: updateData,
        include: {
          company: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          parentAsset: { select: { id: true, name: true, assetTag: true } },
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
    try {
      const [
        totalAssets,
        operationalAssets,
        maintenanceAssets,
        brokenAssets,
        overdueMaintenance,
        openWorkOrders,
      ] = await Promise.all([
        this.prisma.asset.count().catch(() => 0),
        this.prisma.asset.count({ where: { status: 'OPERATIONAL' } }).catch(() => 0),
        this.prisma.asset.count({ where: { status: 'MAINTENANCE' } }).catch(() => 0),
        this.prisma.asset.count({ where: { status: 'BROKEN' } }).catch(() => 0),
        this.prisma.maintenanceSchedule.count({
          where: {
            isActive: true,
            nextDueAt: { 
              lte: new Date(),
              not: null,
            },
          },
        }).catch(() => 0),
        this.prisma.workOrder.count({
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
          },
        }).catch(() => 0),
      ]);

      return {
        totalAssets,
        operationalAssets,
        maintenanceAssets,
        brokenAssets,
        overdueMaintenance,
        openWorkOrders,
      };
    } catch (error) {
      this.logger.error('Error in getOverview:', error);
      // Return default values on error
      return {
        totalAssets: 0,
        operationalAssets: 0,
        maintenanceAssets: 0,
        brokenAssets: 0,
        overdueMaintenance: 0,
        openWorkOrders: 0,
      };
    }
  }
}
