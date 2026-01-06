import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostProfileDto } from './dto/create-cost-profile.dto';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';
import { CalculateCostingDto } from './dto/calculate-costing.dto';
import { VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RouteCostingService {
  constructor(private prisma: PrismaService) {}

  async findAll(vehicleType?: VehicleType, page = 1, limit = 20) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (vehicleType) where.vehicleType = vehicleType;

    const [items, total] = await Promise.all([
      this.prisma.routeCostProfile.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { scenarios: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.routeCostProfile.count({ where }),
    ]);

    return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
  }

  async findOne(id: string) {
    const profile = await this.prisma.routeCostProfile.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        scenarios: { where: { isActive: true }, include: { route: true } },
      },
    });
    if (!profile) throw new NotFoundException('Cost profile not found');
    return profile;
  }

  async create(dto: CreateCostProfileDto, userId?: string) {
    // Validate config schema
    this.validateCostProfileConfig(dto.config);

    return this.prisma.routeCostProfile.create({
      data: {
        ...dto,
        currency: dto.currency || 'USD',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        configJson: dto.config as any,
        createdByUserId: userId,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCostProfileDto) {
    const profile = await this.prisma.routeCostProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Cost profile not found');

    if (dto.config) {
      this.validateCostProfileConfig(dto.config);
    }

    const updateData: any = { ...dto };
    if (dto.config) {
      updateData.configJson = dto.config as any;
      delete updateData.config;
    }

    return this.prisma.routeCostProfile.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const profile = await this.prisma.routeCostProfile.findUnique({
      where: { id },
      include: { _count: { select: { scenarios: true } } },
    });
    if (!profile) throw new NotFoundException('Cost profile not found');
    if (profile._count.scenarios > 0) {
      throw new BadRequestException('Cannot delete cost profile with associated scenarios');
    }
    return this.prisma.routeCostProfile.delete({ where: { id } });
  }

  private validateCostProfileConfig(config: any) {
    // Basic validation - ensure at least some cost components are defined
    const hasFuel = config.fuel && (config.fuel.costPerKm || (config.fuel.costPerUnit && config.fuel.consumptionPerKm));
    const hasMonthly = config.communicationsMonthly || config.laborMonthly || config.docsGpsMonthly || config.depreciationMonthly;
    
    if (!hasFuel && !hasMonthly) {
      throw new BadRequestException('Cost profile must include at least fuel costs or monthly fixed costs');
    }
  }

  // Core calculation engine
  async calculateCosting(dto: CalculateCostingDto) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      include: {
        tollStations: {
          where: { isActive: true },
          include: {
            tollStation: {
              include: {
                rates: {
                  where: {
                    vehicleType: dto.vehicleType,
                    isActive: true,
                    OR: [
                      { effectiveFrom: null },
                      { effectiveFrom: { lte: new Date() } },
                    ],
                    AND: [
                      {
                        OR: [
                          { effectiveTo: null },
                          { effectiveTo: { gte: new Date() } },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!route) throw new NotFoundException('Route not found');

    const profile = await this.prisma.routeCostProfile.findUnique({
      where: { id: dto.costProfileId },
    });

    if (!profile) throw new NotFoundException('Cost profile not found');
    if (profile.vehicleType !== dto.vehicleType) {
      throw new BadRequestException('Cost profile vehicle type does not match');
    }

    const config = profile.configJson as any;
    const distanceKm = new Decimal(route.distanceKm);
    const tonsPerTrip = new Decimal(dto.tonsPerTrip);
    const tripsPerMonth = dto.tripsPerMonth ? new Decimal(dto.tripsPerMonth) : null;

    // Calculate toll per trip
    let tollPerTrip = new Decimal(0);
    const tollStations = [];
    for (const routeStation of route.tollStations) {
      const activeRate = routeStation.tollStation.rates.find((r) => r.isActive);
      if (activeRate) {
        const amount = new Decimal(activeRate.amount);
        tollPerTrip = tollPerTrip.add(amount);
        tollStations.push({
          stationId: routeStation.tollStation.id,
          name: routeStation.tollStation.name,
          amount: amount.toString(),
        });
      }
    }

    const tollPerMonth = tripsPerMonth ? tollPerTrip.mul(tripsPerMonth) : null;

    // Calculate fuel cost per trip
    let fuelCostPerTrip = new Decimal(0);
    if (config.fuel) {
      if (config.fuel.costPerKm) {
        fuelCostPerTrip = new Decimal(config.fuel.costPerKm).mul(distanceKm);
      } else if (config.fuel.costPerUnit && config.fuel.consumptionPerKm) {
        const consumption = new Decimal(config.fuel.consumptionPerKm).mul(distanceKm);
        fuelCostPerTrip = new Decimal(config.fuel.costPerUnit).mul(consumption);
      }
    }

    // Calculate monthly fixed costs
    const communicationsMonthly = config.communicationsMonthly ? new Decimal(config.communicationsMonthly) : new Decimal(0);
    const laborMonthly = config.laborMonthly ? new Decimal(config.laborMonthly) : new Decimal(0);
    const docsGpsMonthly = config.docsGpsMonthly ? new Decimal(config.docsGpsMonthly) : new Decimal(0);
    const depreciationMonthly = config.depreciationMonthly ? new Decimal(config.depreciationMonthly) : new Decimal(0);
    const monthlyFixedCosts = communicationsMonthly.add(laborMonthly).add(docsGpsMonthly).add(depreciationMonthly);

    // Calculate fixed cost per trip
    const fixedCostPerTrip = tripsPerMonth && tripsPerMonth.gt(0)
      ? monthlyFixedCosts.div(tripsPerMonth)
      : new Decimal(0);

    // Overhead per trip
    const overheadPerTrip = config.overheadPerTrip ? new Decimal(config.overheadPerTrip) : new Decimal(0);

    // Base trip cost
    let baseTripCost = fuelCostPerTrip.add(tollPerTrip).add(overheadPerTrip).add(fixedCostPerTrip);

    // Handle empty leg
    const includeEmptyLeg = dto.includeEmptyLeg !== undefined ? dto.includeEmptyLeg : (config.includeEmptyLeg || false);
    const emptyLegFactor = config.emptyLegFactor || 1.0;
    
    let effectiveDistanceKm = distanceKm;
    let effectiveTonsPerKm = tonsPerTrip.mul(distanceKm);
    
    if (includeEmptyLeg) {
      // Multiply distance by (1 + emptyLegFactor) for return leg
      effectiveDistanceKm = distanceKm.mul(new Decimal(1 + emptyLegFactor));
      // For cost per ton per km, denominator includes return leg
      effectiveTonsPerKm = tonsPerTrip.mul(effectiveDistanceKm);
      // Add return fuel cost
      const returnFuelCost = fuelCostPerTrip.mul(new Decimal(emptyLegFactor));
      baseTripCost = baseTripCost.add(returnFuelCost);
    }

    // Cost per ton per km
    if (effectiveTonsPerKm.gt(0)) {
      var costPerTonPerKm = baseTripCost.div(effectiveTonsPerKm);
    } else {
      throw new BadRequestException('Cannot calculate cost per ton per km: tonnage or distance is zero');
    }

    // Cost per ton per km including empty leg (always calculated with return leg)
    const costPerTonPerKmIncludingEmptyLeg = includeEmptyLeg
      ? costPerTonPerKm
      : (() => {
          const returnDistanceKm = distanceKm.mul(new Decimal(1 + emptyLegFactor));
          const returnTonsPerKm = tonsPerTrip.mul(returnDistanceKm);
          const returnBaseCost = baseTripCost.add(fuelCostPerTrip.mul(new Decimal(emptyLegFactor)));
          return returnTonsPerKm.gt(0) ? returnBaseCost.div(returnTonsPerKm) : costPerTonPerKm;
        })();

    // Total cost per month
    const totalCostPerMonth = tripsPerMonth ? baseTripCost.mul(tripsPerMonth) : null;

    // Profit margin
    const profitMarginPercent = dto.profitMarginPercentOverride !== undefined
      ? new Decimal(dto.profitMarginPercentOverride)
      : (config.profitMarginPercent ? new Decimal(config.profitMarginPercent) : new Decimal(0));

    // Sales price with profit margin
    const salesPriceWithProfitMargin = baseTripCost.mul(new Decimal(1).add(profitMarginPercent.div(100)));

    // Sales price per ton
    const salesPricePerTon = tonsPerTrip.gt(0) ? salesPriceWithProfitMargin.div(tonsPerTrip) : new Decimal(0);

    return {
      distanceKm: distanceKm.toString(),
      timeHours: route.timeHours ? route.timeHours.toString() : null,
      tollStations,
      tollPerTrip: tollPerTrip.toString(),
      tollPerMonth: tollPerMonth ? tollPerMonth.toString() : null,
      costComponents: {
        fuel: fuelCostPerTrip.toString(),
        communicationsMonthly: communicationsMonthly.toString(),
        laborMonthly: laborMonthly.toString(),
        docsGpsMonthly: docsGpsMonthly.toString(),
        depreciationMonthly: depreciationMonthly.toString(),
        overheadPerTrip: overheadPerTrip.toString(),
        fixedCostPerTrip: fixedCostPerTrip.toString(),
      },
      totals: {
        totalCostPerTrip: baseTripCost.toString(),
        totalCostPerMonth: totalCostPerMonth ? totalCostPerMonth.toString() : null,
        costPerTonPerKm: costPerTonPerKm.toString(),
        costPerTonPerKmIncludingEmptyLeg: costPerTonPerKmIncludingEmptyLeg.toString(),
        salesPriceWithProfitMargin: salesPriceWithProfitMargin.toString(),
        salesPricePerTon: salesPricePerTon.toString(),
      },
    };
  }
}
