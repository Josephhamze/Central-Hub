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
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let RoutesService = class RoutesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, filters) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (filters?.fromCity)
            where.fromCity = { contains: filters.fromCity, mode: 'insensitive' };
        if (filters?.toCity)
            where.toCity = { contains: filters.toCity, mode: 'insensitive' };
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters?.search) {
            where.OR = [
                { fromCity: { contains: filters.search, mode: 'insensitive' } },
                { toCity: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.route.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    tolls: true,
                    tollStations: {
                        where: { isActive: true },
                        include: { tollStation: { include: { rates: { where: { isActive: true } } } } },
                        orderBy: { sortOrder: 'asc' },
                    },
                    warehouse: { select: { id: true, name: true, locationCity: true } },
                    _count: { select: { quotes: true } },
                    creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.route.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const route = await this.prisma.route.findUnique({
            where: { id },
            include: {
                tolls: true,
                tollStations: {
                    where: { isActive: true },
                    include: {
                        tollStation: {
                            include: {
                                rates: { where: { isActive: true }, orderBy: { vehicleType: 'asc' } },
                            },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                warehouse: { select: { id: true, name: true, locationCity: true } },
                _count: { select: { quotes: true } },
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        return route;
    }
    async getExpectedTollTotal(routeId, vehicleType) {
        const route = await this.prisma.route.findUnique({
            where: { id: routeId },
            include: {
                tollStations: {
                    where: { isActive: true },
                    include: {
                        tollStation: {
                            include: {
                                rates: {
                                    where: {
                                        vehicleType,
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
                },
            },
        });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        let total = new library_1.Decimal(0);
        for (const routeStation of route.tollStations) {
            const activeRate = routeStation.tollStation.rates.find((r) => r.isActive);
            if (activeRate) {
                total = total.add(new library_1.Decimal(activeRate.amount));
            }
        }
        return total;
    }
    async setRouteStations(routeId, dto, userId) {
        const route = await this.prisma.route.findUnique({ where: { id: routeId } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        if (!dto.stations || !Array.isArray(dto.stations)) {
            throw new common_1.BadRequestException('Stations must be an array');
        }
        if (dto.stations.length === 0) {
            await this.prisma.routeTollStation.updateMany({
                where: { routeId },
                data: { isActive: false },
            });
            return this.findOne(routeId);
        }
        const stationIds = dto.stations.map((s) => s.tollStationId).filter(Boolean);
        if (stationIds.length === 0) {
            throw new common_1.BadRequestException('No valid toll station IDs provided');
        }
        const stations = await this.prisma.tollStation.findMany({
            where: { id: { in: stationIds } },
        });
        if (stations.length !== stationIds.length) {
            const foundIds = new Set(stations.map((s) => s.id));
            const missingIds = stationIds.filter((id) => !foundIds.has(id));
            throw new common_1.BadRequestException(`One or more toll stations not found: ${missingIds.join(', ')}`);
        }
        for (const station of dto.stations) {
            if (typeof station.sortOrder !== 'number' || station.sortOrder < 1) {
                throw new common_1.BadRequestException(`Invalid sortOrder for station ${station.tollStationId}: must be a positive number`);
            }
            if (!station.tollStationId || typeof station.tollStationId !== 'string') {
                throw new common_1.BadRequestException('Each station must have a valid tollStationId');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.routeTollStation.updateMany({
                where: { routeId },
                data: { isActive: false },
            });
            const routeStations = dto.stations.map((s) => ({
                routeId,
                tollStationId: s.tollStationId,
                sortOrder: s.sortOrder,
                isActive: true,
            }));
            await tx.routeTollStation.createMany({
                data: routeStations,
            });
            return this.findOne(routeId);
        });
    }
    async deactivate(id) {
        const route = await this.prisma.route.findUnique({ where: { id } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        return this.prisma.route.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async create(dto, userId) {
        if (dto.warehouseId) {
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: dto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Warehouse not found');
            }
        }
        return this.prisma.route.create({
            data: {
                ...dto,
                createdByUserId: userId,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
            include: {
                warehouse: { select: { id: true, name: true, locationCity: true } },
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
    async update(id, dto) {
        const route = await this.prisma.route.findUnique({ where: { id } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        if (dto.warehouseId !== undefined) {
            if (dto.warehouseId) {
                const warehouse = await this.prisma.warehouse.findUnique({
                    where: { id: dto.warehouseId },
                });
                if (!warehouse) {
                    throw new common_1.BadRequestException('Warehouse not found');
                }
            }
        }
        return this.prisma.route.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const route = await this.prisma.route.findUnique({
            where: { id },
            include: { _count: { select: { quotes: true } } },
        });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        if (route._count.quotes > 0) {
            throw new common_1.BadRequestException('Cannot delete route with associated quotes (historical data)');
        }
        return this.prisma.route.delete({ where: { id } });
    }
    async addToll(dto) {
        const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        return this.prisma.toll.create({ data: dto });
    }
    async removeToll(id) {
        const toll = await this.prisma.toll.findUnique({ where: { id } });
        if (!toll)
            throw new common_1.NotFoundException('Toll not found');
        return this.prisma.toll.delete({ where: { id } });
    }
    async bulkImport(file, userId) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('Invalid file: file buffer is missing');
        }
        let XLSX;
        try {
            XLSX = require('xlsx');
        }
        catch (error) {
            throw new common_1.BadRequestException('xlsx package is not installed. Please install it: pnpm add xlsx');
        }
        let workbook;
        try {
            workbook = XLSX.read(file.buffer, { type: 'buffer' });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to read Excel file: ${error.message}`);
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length < 2) {
            throw new common_1.BadRequestException('Excel file must contain at least a header row and one data row');
        }
        const headers = data[0];
        const expectedHeaders = ['From City', 'To City', 'Distance (km)', 'Time (hours)', 'Cost Per Km', 'Notes', 'Is Active'];
        const normalizedHeaders = headers.map(h => h?.toString().trim());
        const headerMap = {};
        expectedHeaders.forEach((expected) => {
            const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
            if (foundIdx !== -1) {
                headerMap[expected] = foundIdx;
            }
        });
        if (headerMap['From City'] === undefined || headerMap['To City'] === undefined || headerMap['Distance (km)'] === undefined) {
            throw new common_1.BadRequestException('Missing required columns: From City, To City, Distance (km)');
        }
        const results = {
            success: [],
            errors: [],
        };
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell || cell.toString().trim() === ''))
                continue;
            try {
                const fromCity = row[headerMap['From City']]?.toString().trim();
                const toCity = row[headerMap['To City']]?.toString().trim();
                const distanceKmStr = row[headerMap['Distance (km)']]?.toString().trim();
                const timeHoursStr = row[headerMap['Time (hours)']]?.toString().trim() || undefined;
                const costPerKmStr = row[headerMap['Cost Per Km']]?.toString().trim() || undefined;
                const notes = row[headerMap['Notes']]?.toString().trim() || undefined;
                const isActiveStr = row[headerMap['Is Active']]?.toString().trim().toLowerCase() || 'yes';
                if (!fromCity)
                    throw new Error('From City is required');
                if (!toCity)
                    throw new Error('To City is required');
                if (!distanceKmStr)
                    throw new Error('Distance (km) is required');
                const distanceKm = parseFloat(distanceKmStr.replace(/[^0-9.]/g, ''));
                if (isNaN(distanceKm) || distanceKm <= 0)
                    throw new Error('Distance (km) must be a valid positive number');
                const timeHours = timeHoursStr ? parseFloat(timeHoursStr.replace(/[^0-9.]/g, '')) : undefined;
                if (timeHoursStr && (isNaN(timeHours) || timeHours <= 0)) {
                    throw new Error('Time (hours) must be a valid positive number');
                }
                const costPerKm = costPerKmStr ? parseFloat(costPerKmStr.replace(/[^0-9.]/g, '')) : undefined;
                if (costPerKmStr && (isNaN(costPerKm) || costPerKm < 0)) {
                    throw new Error('Cost Per Km must be a valid non-negative number');
                }
                const isActive = isActiveStr === 'yes' || isActiveStr === 'true' || isActiveStr === '1';
                const existingRoute = await this.prisma.route.findFirst({
                    where: {
                        fromCity: { equals: fromCity, mode: 'insensitive' },
                        toCity: { equals: toCity, mode: 'insensitive' },
                    },
                });
                if (existingRoute) {
                    throw new Error(`Route from "${fromCity}" to "${toCity}" already exists`);
                }
                const route = await this.prisma.route.create({
                    data: {
                        fromCity,
                        toCity,
                        distanceKm: new library_1.Decimal(distanceKm),
                        timeHours: timeHours ? new library_1.Decimal(timeHours) : undefined,
                        costPerKm: costPerKm ? new library_1.Decimal(costPerKm) : undefined,
                        notes,
                        isActive,
                        createdByUserId: userId,
                    },
                });
                results.success.push({ row: i + 1, fromCity, toCity });
            }
            catch (error) {
                results.errors.push({
                    row: i + 1,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return results;
    }
    async createRouteRequest(dto, userId) {
        if (dto.warehouseId) {
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: dto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Warehouse not found');
            }
        }
        if (dto.quoteId) {
            const quote = await this.prisma.quote.findUnique({
                where: { id: dto.quoteId },
            });
            if (!quote) {
                throw new common_1.BadRequestException('Quote not found');
            }
        }
        return this.prisma.routeRequest.create({
            data: {
                fromCity: dto.fromCity,
                toCity: dto.toCity,
                distanceKm: dto.distanceKm ? new library_1.Decimal(dto.distanceKm) : null,
                timeHours: dto.timeHours ? new library_1.Decimal(dto.timeHours) : null,
                warehouseId: dto.warehouseId,
                notes: dto.notes,
                quoteId: dto.quoteId,
                requestedByUserId: userId,
                status: client_1.RouteRequestStatus.PENDING,
            },
            include: {
                warehouse: { select: { id: true, name: true, locationCity: true } },
                requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                quote: { select: { id: true, quoteNumber: true } },
            },
        });
    }
    async findAllRouteRequests(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [items, total] = await Promise.all([
            this.prisma.routeRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    warehouse: { select: { id: true, name: true, locationCity: true } },
                    requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                    reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                    quote: { select: { id: true, quoteNumber: true } },
                },
            }),
            this.prisma.routeRequest.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOneRouteRequest(id) {
        const request = await this.prisma.routeRequest.findUnique({
            where: { id },
            include: {
                warehouse: { select: { id: true, name: true, locationCity: true } },
                requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                quote: { select: { id: true, quoteNumber: true } },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Route request not found');
        }
        return request;
    }
    async reviewRouteRequest(id, dto, reviewerId) {
        const request = await this.prisma.routeRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new common_1.NotFoundException('Route request not found');
        }
        if (request.status !== client_1.RouteRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Route request has already been reviewed');
        }
        if (dto.status === client_1.RouteRequestStatus.APPROVED) {
            if (!request.fromCity || !request.toCity || !request.distanceKm) {
                throw new common_1.BadRequestException('Cannot approve route request: fromCity, toCity, and distanceKm must be filled in before approval');
            }
            const route = await this.prisma.route.create({
                data: {
                    fromCity: request.fromCity,
                    toCity: request.toCity,
                    distanceKm: request.distanceKm,
                    timeHours: request.timeHours,
                    warehouseId: request.warehouseId,
                    notes: request.notes,
                    createdByUserId: request.requestedByUserId,
                    isActive: true,
                },
                include: {
                    warehouse: { select: { id: true, name: true, locationCity: true } },
                    creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });
            await this.prisma.routeRequest.update({
                where: { id },
                data: {
                    status: dto.status,
                    reviewedByUserId: reviewerId,
                    reviewedAt: new Date(),
                    rejectionReason: null,
                    approvedRouteId: route.id,
                },
            });
            if (request.quoteId) {
                await this.prisma.quote.update({
                    where: { id: request.quoteId },
                    data: { routeId: route.id },
                });
            }
            return { request: await this.findOneRouteRequest(id), route };
        }
        return this.prisma.routeRequest.update({
            where: { id },
            data: {
                status: dto.status,
                reviewedByUserId: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: dto.rejectionReason || null,
            },
            include: {
                warehouse: { select: { id: true, name: true, locationCity: true } },
                requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                quote: { select: { id: true, quoteNumber: true } },
            },
        });
    }
    async deleteRouteRequest(id) {
        const request = await this.prisma.routeRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new common_1.NotFoundException('Route request not found');
        }
        if (request.status !== client_1.RouteRequestStatus.REJECTED) {
            throw new common_1.BadRequestException('Only rejected route requests can be deleted');
        }
        return this.prisma.routeRequest.delete({
            where: { id },
        });
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoutesService);
//# sourceMappingURL=routes.service.js.map