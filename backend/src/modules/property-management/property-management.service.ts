import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PropertyType,
  OwnershipType,
  PropertyStatus,
  PropertyHealthStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePropertyDto {
  name: string;
  propertyType: PropertyType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  unitCount?: number;
  floorArea?: number;
  plotSize?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  description?: string;
  amenities?: string[];
  ownershipType: OwnershipType;
  purchaseDate?: Date;
  purchaseValue?: number;
  currentMarketValue?: number;
  currentRentalValue?: number;
  currency?: string;
  marketRentEstimate?: number;
  annualEscalationPct?: number;
  parentPropertyId?: string;
  companyId?: string;
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {
  status?: PropertyStatus;
  healthStatus?: PropertyHealthStatus;
  lastValuationDate?: Date;
}

export interface CreatePropertyUnitDto {
  propertyId: string;
  name: string;
  floorNumber?: number;
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  hasBalcony?: boolean;
  hasFurnished?: boolean;
  description?: string;
  amenities?: string[];
  baseRentalValue?: number;
  currentRentalValue?: number;
  currency?: string;
  electricityMeter?: string;
  waterMeter?: string;
  gasMeter?: string;
}

export interface UpdatePropertyUnitDto extends Partial<Omit<CreatePropertyUnitDto, 'propertyId'>> {
  status?: PropertyStatus;
}

export interface PropertyListParams {
  page?: number;
  limit?: number;
  search?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  healthStatus?: PropertyHealthStatus;
  city?: string;
  ownershipType?: OwnershipType;
  companyId?: string;
}

export interface PropertySummary {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalMarketValue: number;
  totalRentalIncome: number;
  byStatus: Record<PropertyStatus, number>;
  byType: Record<PropertyType, number>;
  byHealth: Record<PropertyHealthStatus, number>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PropertyManagementService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // PROPERTY CRUD
  // --------------------------------------------------------------------------

  async createProperty(dto: CreatePropertyDto, userId?: string) {
    // Generate property code
    const count = await this.prisma.property.count();
    const propertyCode = `PROP-${String(count + 1).padStart(5, '0')}`;

    const property = await this.prisma.property.create({
      data: {
        propertyCode,
        name: dto.name,
        propertyType: dto.propertyType,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        gpsLatitude: dto.gpsLatitude ? new Prisma.Decimal(dto.gpsLatitude) : null,
        gpsLongitude: dto.gpsLongitude ? new Prisma.Decimal(dto.gpsLongitude) : null,
        unitCount: dto.unitCount ?? 1,
        floorArea: dto.floorArea ? new Prisma.Decimal(dto.floorArea) : null,
        plotSize: dto.plotSize ? new Prisma.Decimal(dto.plotSize) : null,
        floors: dto.floors,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        parkingSpaces: dto.parkingSpaces,
        yearBuilt: dto.yearBuilt,
        description: dto.description,
        amenities: dto.amenities,
        ownershipType: dto.ownershipType,
        status: PropertyStatus.VACANT,
        purchaseDate: dto.purchaseDate,
        purchaseValue: dto.purchaseValue ? new Prisma.Decimal(dto.purchaseValue) : null,
        currentMarketValue: dto.currentMarketValue ? new Prisma.Decimal(dto.currentMarketValue) : null,
        currentRentalValue: dto.currentRentalValue ? new Prisma.Decimal(dto.currentRentalValue) : null,
        currency: dto.currency ?? 'USD',
        marketRentEstimate: dto.marketRentEstimate ? new Prisma.Decimal(dto.marketRentEstimate) : null,
        annualEscalationPct: dto.annualEscalationPct ? new Prisma.Decimal(dto.annualEscalationPct) : null,
        parentPropertyId: dto.parentPropertyId,
        companyId: dto.companyId,
        createdById: userId,
      },
      include: {
        units: true,
        parentProperty: true,
        childProperties: true,
      },
    });

    return property;
  }

  async findAllProperties(params: PropertyListParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      propertyType,
      status,
      healthStatus,
      city,
      ownershipType,
      companyId,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { propertyCode: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (propertyType) where.propertyType = propertyType;
    if (status) where.status = status;
    if (healthStatus) where.healthStatus = healthStatus;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (ownershipType) where.ownershipType = ownershipType;
    if (companyId) where.companyId = companyId;

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          units: {
            select: {
              id: true,
              unitCode: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              units: true,
              leases: true,
              expenses: true,
              utilityBills: true,
              maintenanceJobs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
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

  async findPropertyById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        units: true,
        leases: {
          where: { isActive: true },
          include: {
            tenant: true,
          },
        },
        expenses: {
          take: 10,
          orderBy: { expenseDate: 'desc' },
        },
        utilityBills: {
          take: 10,
          orderBy: { billDate: 'desc' },
        },
        maintenanceJobs: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          orderBy: { reportedDate: 'desc' },
        },
        kpiSnapshots: {
          take: 12,
          orderBy: { snapshotDate: 'desc' },
        },
        parentProperty: true,
        childProperties: true,
        _count: {
          select: {
            units: true,
            leases: true,
            expenses: true,
            utilityBills: true,
            maintenanceJobs: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async findPropertyByCode(propertyCode: string) {
    const property = await this.prisma.property.findUnique({
      where: { propertyCode },
      include: {
        units: true,
        _count: {
          select: {
            units: true,
            leases: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with code ${propertyCode} not found`);
    }

    return property;
  }

  async updateProperty(id: string, dto: UpdatePropertyDto) {
    await this.findPropertyById(id);

    const updateData: Prisma.PropertyUpdateInput = {};

    // Assign simple fields explicitly
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.propertyType !== undefined) updateData.propertyType = dto.propertyType;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.unitCount !== undefined) updateData.unitCount = dto.unitCount;
    if (dto.floors !== undefined) updateData.floors = dto.floors;
    if (dto.bedrooms !== undefined) updateData.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) updateData.bathrooms = dto.bathrooms;
    if (dto.parkingSpaces !== undefined) updateData.parkingSpaces = dto.parkingSpaces;
    if (dto.yearBuilt !== undefined) updateData.yearBuilt = dto.yearBuilt;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amenities !== undefined) updateData.amenities = dto.amenities;
    if (dto.ownershipType !== undefined) updateData.ownershipType = dto.ownershipType;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.healthStatus !== undefined) updateData.healthStatus = dto.healthStatus;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate;
    if (dto.lastValuationDate !== undefined) updateData.lastValuationDate = dto.lastValuationDate;
    if (dto.parentPropertyId !== undefined) updateData.parentPropertyId = dto.parentPropertyId;
    if (dto.companyId !== undefined) updateData.companyId = dto.companyId;

    // Assign decimal fields explicitly
    if (dto.gpsLatitude !== undefined) updateData.gpsLatitude = dto.gpsLatitude ? new Prisma.Decimal(dto.gpsLatitude) : null;
    if (dto.gpsLongitude !== undefined) updateData.gpsLongitude = dto.gpsLongitude ? new Prisma.Decimal(dto.gpsLongitude) : null;
    if (dto.floorArea !== undefined) updateData.floorArea = dto.floorArea ? new Prisma.Decimal(dto.floorArea) : null;
    if (dto.plotSize !== undefined) updateData.plotSize = dto.plotSize ? new Prisma.Decimal(dto.plotSize) : null;
    if (dto.purchaseValue !== undefined) updateData.purchaseValue = dto.purchaseValue ? new Prisma.Decimal(dto.purchaseValue) : null;
    if (dto.currentMarketValue !== undefined) updateData.currentMarketValue = dto.currentMarketValue ? new Prisma.Decimal(dto.currentMarketValue) : null;
    if (dto.currentRentalValue !== undefined) updateData.currentRentalValue = dto.currentRentalValue ? new Prisma.Decimal(dto.currentRentalValue) : null;
    if (dto.marketRentEstimate !== undefined) updateData.marketRentEstimate = dto.marketRentEstimate ? new Prisma.Decimal(dto.marketRentEstimate) : null;
    if (dto.annualEscalationPct !== undefined) updateData.annualEscalationPct = dto.annualEscalationPct ? new Prisma.Decimal(dto.annualEscalationPct) : null;

    const property = await this.prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        units: true,
        _count: {
          select: {
            units: true,
            leases: true,
          },
        },
      },
    });

    return property;
  }

  async deleteProperty(id: string) {
    await this.findPropertyById(id);

    // Check for active leases
    const activeLeases = await this.prisma.lease.count({
      where: { propertyId: id, isActive: true },
    });

    if (activeLeases > 0) {
      throw new BadRequestException(
        `Cannot delete property with ${activeLeases} active lease(s). Please terminate leases first.`
      );
    }

    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  // --------------------------------------------------------------------------
  // PROPERTY UNIT CRUD
  // --------------------------------------------------------------------------

  async createPropertyUnit(dto: CreatePropertyUnitDto) {
    // Verify property exists
    const property = await this.findPropertyById(dto.propertyId);

    // Generate unit code
    const unitCount = await this.prisma.propertyUnit.count({
      where: { propertyId: dto.propertyId },
    });
    const unitCode = `${property.propertyCode}-U${String(unitCount + 1).padStart(3, '0')}`;

    const unit = await this.prisma.propertyUnit.create({
      data: {
        propertyId: dto.propertyId,
        unitCode,
        name: dto.name,
        floorNumber: dto.floorNumber,
        floorArea: dto.floorArea ? new Prisma.Decimal(dto.floorArea) : null,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        parkingSpaces: dto.parkingSpaces,
        hasBalcony: dto.hasBalcony ?? false,
        hasFurnished: dto.hasFurnished ?? false,
        description: dto.description,
        amenities: dto.amenities,
        baseRentalValue: dto.baseRentalValue ? new Prisma.Decimal(dto.baseRentalValue) : null,
        currentRentalValue: dto.currentRentalValue ? new Prisma.Decimal(dto.currentRentalValue) : null,
        currency: dto.currency ?? 'USD',
        electricityMeter: dto.electricityMeter,
        waterMeter: dto.waterMeter,
        gasMeter: dto.gasMeter,
        status: PropertyStatus.VACANT,
      },
      include: {
        property: true,
      },
    });

    // Update property unit count
    await this.prisma.property.update({
      where: { id: dto.propertyId },
      data: { unitCount: { increment: 1 } },
    });

    return unit;
  }

  async findAllPropertyUnits(propertyId: string, params: { page?: number; limit?: number; status?: PropertyStatus } = {}) {
    const { page = 1, limit = 50, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyUnitWhereInput = { propertyId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.propertyUnit.findMany({
        where,
        skip,
        take: limit,
        include: {
          leases: {
            where: { isActive: true },
            include: { tenant: true },
          },
          _count: {
            select: {
              leases: true,
              utilityBills: true,
              maintenanceJobs: true,
            },
          },
        },
        orderBy: { unitCode: 'asc' },
      }),
      this.prisma.propertyUnit.count({ where }),
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

  async findPropertyUnitById(id: string) {
    const unit = await this.prisma.propertyUnit.findUnique({
      where: { id },
      include: {
        property: true,
        leases: {
          include: { tenant: true },
          orderBy: { startDate: 'desc' },
        },
        utilityBills: {
          take: 10,
          orderBy: { billDate: 'desc' },
        },
        maintenanceJobs: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Property unit with ID ${id} not found`);
    }

    return unit;
  }

  async updatePropertyUnit(id: string, dto: UpdatePropertyUnitDto) {
    await this.findPropertyUnitById(id);

    const updateData: Prisma.PropertyUnitUpdateInput = {};

    // Assign simple fields explicitly
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.floorNumber !== undefined) updateData.floorNumber = dto.floorNumber;
    if (dto.bedrooms !== undefined) updateData.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) updateData.bathrooms = dto.bathrooms;
    if (dto.parkingSpaces !== undefined) updateData.parkingSpaces = dto.parkingSpaces;
    if (dto.hasBalcony !== undefined) updateData.hasBalcony = dto.hasBalcony;
    if (dto.hasFurnished !== undefined) updateData.hasFurnished = dto.hasFurnished;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amenities !== undefined) updateData.amenities = dto.amenities;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.electricityMeter !== undefined) updateData.electricityMeter = dto.electricityMeter;
    if (dto.waterMeter !== undefined) updateData.waterMeter = dto.waterMeter;
    if (dto.gasMeter !== undefined) updateData.gasMeter = dto.gasMeter;

    // Assign decimal fields explicitly
    if (dto.floorArea !== undefined) updateData.floorArea = dto.floorArea ? new Prisma.Decimal(dto.floorArea) : null;
    if (dto.baseRentalValue !== undefined) updateData.baseRentalValue = dto.baseRentalValue ? new Prisma.Decimal(dto.baseRentalValue) : null;
    if (dto.currentRentalValue !== undefined) updateData.currentRentalValue = dto.currentRentalValue ? new Prisma.Decimal(dto.currentRentalValue) : null;

    return this.prisma.propertyUnit.update({
      where: { id },
      data: updateData,
      include: { property: true },
    });
  }

  async deletePropertyUnit(id: string) {
    const unit = await this.findPropertyUnitById(id);

    const activeLeases = await this.prisma.lease.count({
      where: { unitId: id, isActive: true },
    });

    if (activeLeases > 0) {
      throw new BadRequestException(
        `Cannot delete unit with ${activeLeases} active lease(s).`
      );
    }

    await this.prisma.propertyUnit.delete({ where: { id } });

    // Decrement property unit count
    await this.prisma.property.update({
      where: { id: unit.propertyId },
      data: { unitCount: { decrement: 1 } },
    });

    return { deleted: true };
  }

  // --------------------------------------------------------------------------
  // PROPERTY SUMMARY & STATISTICS
  // --------------------------------------------------------------------------

  async getPropertySummary(): Promise<PropertySummary> {
    const [
      totalProperties,
      propertiesByStatus,
      propertiesByType,
      propertiesByHealth,
      allProperties,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.property.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['propertyType'],
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['healthStatus'],
        _count: true,
      }),
      this.prisma.property.findMany({
        select: {
          unitCount: true,
          currentMarketValue: true,
          currentRentalValue: true,
          units: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    // Calculate unit statistics
    let totalUnits = 0;
    let occupiedUnits = 0;
    let vacantUnits = 0;
    let totalMarketValue = 0;
    let totalRentalIncome = 0;

    for (const property of allProperties) {
      totalUnits += property.unitCount;
      totalMarketValue += property.currentMarketValue?.toNumber() || 0;
      totalRentalIncome += property.currentRentalValue?.toNumber() || 0;

      for (const unit of property.units) {
        if (unit.status === PropertyStatus.OCCUPIED) {
          occupiedUnits++;
        } else if (unit.status === PropertyStatus.VACANT) {
          vacantUnits++;
        }
      }
    }

    // If no units defined, use property status
    if (totalUnits === allProperties.length) {
      for (const property of allProperties) {
        if (property.units.length === 0) {
          const propStatus = propertiesByStatus.find(p => p._count > 0);
          // Simple approximation - properties without units count as single unit
        }
      }
    }

    const byStatus: Record<PropertyStatus, number> = {
      [PropertyStatus.VACANT]: 0,
      [PropertyStatus.OCCUPIED]: 0,
      [PropertyStatus.UNDER_MAINTENANCE]: 0,
      [PropertyStatus.LISTED]: 0,
      [PropertyStatus.INACTIVE]: 0,
    };

    for (const item of propertiesByStatus) {
      byStatus[item.status] = item._count;
    }

    const byType: Record<PropertyType, number> = {
      [PropertyType.RESIDENTIAL]: 0,
      [PropertyType.COMMERCIAL]: 0,
      [PropertyType.MIXED_USE]: 0,
      [PropertyType.INDUSTRIAL]: 0,
      [PropertyType.LAND]: 0,
    };

    for (const item of propertiesByType) {
      byType[item.propertyType] = item._count;
    }

    const byHealth: Record<PropertyHealthStatus, number> = {
      [PropertyHealthStatus.HEALTHY]: 0,
      [PropertyHealthStatus.AT_RISK]: 0,
      [PropertyHealthStatus.UNDERPERFORMING]: 0,
      [PropertyHealthStatus.NON_PERFORMING]: 0,
    };

    for (const item of propertiesByHealth) {
      if (item.healthStatus) {
        byHealth[item.healthStatus] = item._count;
      }
    }

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
      totalMarketValue,
      totalRentalIncome,
      byStatus,
      byType,
      byHealth,
    };
  }

  // --------------------------------------------------------------------------
  // PROPERTY STATUS UPDATES
  // --------------------------------------------------------------------------

  async updatePropertyStatus(id: string, status: PropertyStatus) {
    await this.findPropertyById(id);

    return this.prisma.property.update({
      where: { id },
      data: { status },
    });
  }

  async updatePropertyHealthStatus(id: string, healthStatus: PropertyHealthStatus) {
    await this.findPropertyById(id);

    return this.prisma.property.update({
      where: { id },
      data: { healthStatus },
    });
  }

  async updateUnitStatus(id: string, status: PropertyStatus) {
    await this.findPropertyUnitById(id);

    return this.prisma.propertyUnit.update({
      where: { id },
      data: { status },
    });
  }

  // --------------------------------------------------------------------------
  // VACANCY TRACKING
  // --------------------------------------------------------------------------

  async getVacantProperties() {
    return this.prisma.property.findMany({
      where: { status: PropertyStatus.VACANT },
      include: {
        units: {
          where: { status: PropertyStatus.VACANT },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVacantUnits() {
    return this.prisma.propertyUnit.findMany({
      where: { status: PropertyStatus.VACANT },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
