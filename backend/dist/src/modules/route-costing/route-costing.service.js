"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteCostingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let RouteCostingService = class RouteCostingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(vehicleType, page = 1, limit = 20) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (vehicleType)
            where.vehicleType = vehicleType;
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
    async findOne(id) {
        const profile = await this.prisma.routeCostProfile.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                scenarios: { where: { isActive: true }, include: { route: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Cost profile not found');
        return profile;
    }
    async create(dto, userId) {
        this.validateCostProfileConfig(dto.config);
        return this.prisma.routeCostProfile.create({
            data: {
                ...dto,
                currency: dto.currency || 'USD',
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                configJson: dto.config,
                createdByUserId: userId,
            },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
    async update(id, dto) {
        const profile = await this.prisma.routeCostProfile.findUnique({ where: { id } });
        if (!profile)
            throw new common_1.NotFoundException('Cost profile not found');
        if (dto.config) {
            this.validateCostProfileConfig(dto.config);
        }
        const updateData = { ...dto };
        if (dto.config) {
            updateData.configJson = dto.config;
            delete updateData.config;
        }
        return this.prisma.routeCostProfile.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        const profile = await this.prisma.routeCostProfile.findUnique({
            where: { id },
            include: { _count: { select: { scenarios: true } } },
        });
        if (!profile)
            throw new common_1.NotFoundException('Cost profile not found');
        if (profile._count.scenarios > 0) {
            throw new common_1.BadRequestException('Cannot delete cost profile with associated scenarios');
        }
        return this.prisma.routeCostProfile.delete({ where: { id } });
    }
    validateCostProfileConfig(config) {
        const hasFuel = config.fuel && (config.fuel.costPerKm || (config.fuel.costPerUnit && config.fuel.consumptionPerKm));
        const hasMonthly = config.communicationsMonthly || config.laborMonthly || config.docsGpsMonthly || config.depreciationMonthly;
        if (!hasFuel && !hasMonthly) {
            throw new common_1.BadRequestException('Cost profile must include at least fuel costs or monthly fixed costs');
        }
    }
    async calculateCosting(dto) {
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
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        const profile = await this.prisma.routeCostProfile.findUnique({
            where: { id: dto.costProfileId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Cost profile not found');
        if (profile.vehicleType !== dto.vehicleType) {
            throw new common_1.BadRequestException('Cost profile vehicle type does not match');
        }
        const config = profile.configJson;
        const distanceKm = new library_1.Decimal(route.distanceKm);
        const tonsPerTrip = new library_1.Decimal(dto.tonsPerTrip);
        const tripsPerMonth = dto.tripsPerMonth ? new library_1.Decimal(dto.tripsPerMonth) : null;
        let tollPerTrip = new library_1.Decimal(0);
        const tollStations = [];
        for (const routeStation of route.tollStations) {
            const activeRate = routeStation.tollStation.rates.find((r) => r.isActive);
            if (activeRate) {
                const amount = new library_1.Decimal(activeRate.amount);
                tollPerTrip = tollPerTrip.add(amount);
                tollStations.push({
                    stationId: routeStation.tollStation.id,
                    name: routeStation.tollStation.name,
                    amount: amount.toString(),
                });
            }
        }
        const tollPerMonth = tripsPerMonth ? tollPerTrip.mul(tripsPerMonth) : null;
        let fuelCostPerTrip = new library_1.Decimal(0);
        if (config.fuel) {
            if (config.fuel.costPerKm) {
                fuelCostPerTrip = new library_1.Decimal(config.fuel.costPerKm).mul(distanceKm);
            }
            else if (config.fuel.costPerUnit && config.fuel.consumptionPerKm) {
                const consumption = new library_1.Decimal(config.fuel.consumptionPerKm).mul(distanceKm);
                fuelCostPerTrip = new library_1.Decimal(config.fuel.costPerUnit).mul(consumption);
            }
        }
        const communicationsMonthly = config.communicationsMonthly ? new library_1.Decimal(config.communicationsMonthly) : new library_1.Decimal(0);
        const laborMonthly = config.laborMonthly ? new library_1.Decimal(config.laborMonthly) : new library_1.Decimal(0);
        const docsGpsMonthly = config.docsGpsMonthly ? new library_1.Decimal(config.docsGpsMonthly) : new library_1.Decimal(0);
        const depreciationMonthly = config.depreciationMonthly ? new library_1.Decimal(config.depreciationMonthly) : new library_1.Decimal(0);
        const monthlyFixedCosts = communicationsMonthly.add(laborMonthly).add(docsGpsMonthly).add(depreciationMonthly);
        const fixedCostPerTrip = tripsPerMonth && tripsPerMonth.gt(0)
            ? monthlyFixedCosts.div(tripsPerMonth)
            : new library_1.Decimal(0);
        const overheadPerTrip = config.overheadPerTrip ? new library_1.Decimal(config.overheadPerTrip) : new library_1.Decimal(0);
        let baseTripCost = fuelCostPerTrip.add(tollPerTrip).add(overheadPerTrip).add(fixedCostPerTrip);
        const includeEmptyLeg = dto.includeEmptyLeg !== undefined ? dto.includeEmptyLeg : (config.includeEmptyLeg || false);
        const emptyLegFactor = config.emptyLegFactor || 1.0;
        let effectiveDistanceKm = distanceKm;
        let effectiveTonsPerKm = tonsPerTrip.mul(distanceKm);
        if (includeEmptyLeg) {
            effectiveDistanceKm = distanceKm.mul(new library_1.Decimal(1 + emptyLegFactor));
            effectiveTonsPerKm = tonsPerTrip.mul(effectiveDistanceKm);
            const returnFuelCost = fuelCostPerTrip.mul(new library_1.Decimal(emptyLegFactor));
            baseTripCost = baseTripCost.add(returnFuelCost);
        }
        if (effectiveTonsPerKm.gt(0)) {
            var costPerTonPerKm = baseTripCost.div(effectiveTonsPerKm);
        }
        else {
            throw new common_1.BadRequestException('Cannot calculate cost per ton per km: tonnage or distance is zero');
        }
        const costPerTonPerKmIncludingEmptyLeg = includeEmptyLeg
            ? costPerTonPerKm
            : (() => {
                const returnDistanceKm = distanceKm.mul(new library_1.Decimal(1 + emptyLegFactor));
                const returnTonsPerKm = tonsPerTrip.mul(returnDistanceKm);
                const returnBaseCost = baseTripCost.add(fuelCostPerTrip.mul(new library_1.Decimal(emptyLegFactor)));
                return returnTonsPerKm.gt(0) ? returnBaseCost.div(returnTonsPerKm) : costPerTonPerKm;
            })();
        const totalCostPerMonth = tripsPerMonth ? baseTripCost.mul(tripsPerMonth) : null;
        const profitMarginPercent = dto.profitMarginPercentOverride !== undefined
            ? new library_1.Decimal(dto.profitMarginPercentOverride)
            : (config.profitMarginPercent ? new library_1.Decimal(config.profitMarginPercent) : new library_1.Decimal(0));
        const salesPriceWithProfitMargin = baseTripCost.mul(new library_1.Decimal(1).add(profitMarginPercent.div(100)));
        const salesPricePerTon = tonsPerTrip.gt(0) ? salesPriceWithProfitMargin.div(tonsPerTrip) : new library_1.Decimal(0);
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
};
exports.RouteCostingService = RouteCostingService;
exports.RouteCostingService = RouteCostingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RouteCostingService);
//# sourceMappingURL=route-costing.service.js.map