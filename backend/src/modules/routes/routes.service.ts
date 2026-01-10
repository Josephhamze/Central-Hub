import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { SetRouteStationsDto } from './dto/set-route-stations.dto';
import { CreateRouteRequestDto } from './dto/create-route-request.dto';
import { ReviewRouteRequestDto } from './dto/review-route-request.dto';
import { VehicleType, RouteRequestStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      fromCity?: string;
      toCity?: string;
      isActive?: boolean;
      search?: string;
    },
  ) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    if (filters?.fromCity) where.fromCity = { contains: filters.fromCity, mode: 'insensitive' };
    if (filters?.toCity) where.toCity = { contains: filters.toCity, mode: 'insensitive' };
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
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

  async findOne(id: string) {
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
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  // Calculate expected toll total for a route by vehicle type
  async getExpectedTollTotal(routeId: string, vehicleType: VehicleType): Promise<Decimal> {
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

    if (!route) throw new NotFoundException('Route not found');

    let total = new Decimal(0);
    for (const routeStation of route.tollStations) {
      const activeRate = routeStation.tollStation.rates.find((r) => r.isActive);
      if (activeRate) {
        total = total.add(new Decimal(activeRate.amount));
      }
    }

    return total;
  }

  // Set ordered toll stations for a route
  async setRouteStations(routeId: string, dto: SetRouteStationsDto, userId?: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    // Validate stations array
    if (!dto.stations || !Array.isArray(dto.stations)) {
      throw new BadRequestException('Stations must be an array');
    }

    if (dto.stations.length === 0) {
      // Allow empty array to clear all stations
      await this.prisma.routeTollStation.updateMany({
        where: { routeId },
        data: { isActive: false },
      });
      return this.findOne(routeId);
    }

    // Validate all toll stations exist
    const stationIds = dto.stations.map((s) => s.tollStationId).filter(Boolean);
    if (stationIds.length === 0) {
      throw new BadRequestException('No valid toll station IDs provided');
    }

    const stations = await this.prisma.tollStation.findMany({
      where: { id: { in: stationIds } },
    });
    if (stations.length !== stationIds.length) {
      const foundIds = new Set(stations.map((s) => s.id));
      const missingIds = stationIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`One or more toll stations not found: ${missingIds.join(', ')}`);
    }

    // Validate sortOrder values
    for (const station of dto.stations) {
      if (typeof station.sortOrder !== 'number' || station.sortOrder < 1) {
        throw new BadRequestException(`Invalid sortOrder for station ${station.tollStationId}: must be a positive number`);
      }
      if (!station.tollStationId || typeof station.tollStationId !== 'string') {
        throw new BadRequestException('Each station must have a valid tollStationId');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Deactivate all existing route stations
      await tx.routeTollStation.updateMany({
        where: { routeId },
        data: { isActive: false },
      });

      // Create new route stations
      const routeStations = dto.stations.map((s) => ({
        routeId,
        tollStationId: s.tollStationId,
        sortOrder: s.sortOrder,
        isActive: true,
      }));

      await tx.routeTollStation.createMany({
        data: routeStations,
      });

      // Return updated route with stations
      return this.findOne(routeId);
    });
  }

  async deactivate(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.route.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async create(dto: CreateRouteDto, userId?: string) {
    // Validate warehouse if provided
    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!warehouse) {
        throw new BadRequestException('Warehouse not found');
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

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
    
    // Validate warehouse if provided
    if (dto.warehouseId !== undefined) {
      if (dto.warehouseId) {
        const warehouse = await this.prisma.warehouse.findUnique({
          where: { id: dto.warehouseId },
        });
        if (!warehouse) {
          throw new BadRequestException('Warehouse not found');
        }
      }
    }
    
    return this.prisma.route.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: { _count: { select: { quotes: true } } },
    });
    if (!route) throw new NotFoundException('Route not found');
    if (route._count.quotes > 0) {
      throw new BadRequestException('Cannot delete route with associated quotes (historical data)');
    }
    return this.prisma.route.delete({ where: { id } });
  }

  async addToll(dto: CreateTollDto) {
    const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.toll.create({ data: dto });
  }

  async removeToll(id: string) {
    const toll = await this.prisma.toll.findUnique({ where: { id } });
    if (!toll) throw new NotFoundException('Toll not found');
    return this.prisma.toll.delete({ where: { id } });
  }

  async bulkImport(file: any, userId?: string) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file: file buffer is missing');
    }
    
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (error) {
      throw new BadRequestException('xlsx package is not installed. Please install it: pnpm add xlsx');
    }
    
    let workbook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (error: any) {
      throw new BadRequestException(`Failed to read Excel file: ${error.message}`);
    }
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new BadRequestException('Excel file must contain at least a header row and one data row');
    }

    // Expected headers: From City, To City, Distance (km), Time (hours), Cost Per Km (optional), Notes (optional), Is Active
    const headers = data[0] as string[];
    const expectedHeaders = ['From City', 'To City', 'Distance (km)', 'Time (hours)', 'Cost Per Km', 'Notes', 'Is Active'];
    
    // Validate headers (case-insensitive)
    const normalizedHeaders = headers.map(h => h?.toString().trim());
    const headerMap: Record<string, number> = {};
    expectedHeaders.forEach((expected) => {
      const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
      if (foundIdx !== -1) {
        headerMap[expected] = foundIdx;
      }
    });

    // Validate required headers
    if (headerMap['From City'] === undefined || headerMap['To City'] === undefined || headerMap['Distance (km)'] === undefined) {
      throw new BadRequestException('Missing required columns: From City, To City, Distance (km)');
    }

    const results = {
      success: [] as Array<{ row: number; fromCity: string; toCity: string }>,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue; // Skip empty rows

      try {
        const fromCity = row[headerMap['From City']]?.toString().trim();
        const toCity = row[headerMap['To City']]?.toString().trim();
        const distanceKmStr = row[headerMap['Distance (km)']]?.toString().trim();
        const timeHoursStr = row[headerMap['Time (hours)']]?.toString().trim() || undefined;
        const costPerKmStr = row[headerMap['Cost Per Km']]?.toString().trim() || undefined;
        const notes = row[headerMap['Notes']]?.toString().trim() || undefined;
        const isActiveStr = row[headerMap['Is Active']]?.toString().trim().toLowerCase() || 'yes';

        // Validation
        if (!fromCity) throw new Error('From City is required');
        if (!toCity) throw new Error('To City is required');
        if (!distanceKmStr) throw new Error('Distance (km) is required');
        
        const distanceKm = parseFloat(distanceKmStr.replace(/[^0-9.]/g, ''));
        if (isNaN(distanceKm) || distanceKm <= 0) throw new Error('Distance (km) must be a valid positive number');

        const timeHours = timeHoursStr ? parseFloat(timeHoursStr.replace(/[^0-9.]/g, '')) : undefined;
        if (timeHoursStr && (isNaN(timeHours!) || timeHours! <= 0)) {
          throw new Error('Time (hours) must be a valid positive number');
        }

        const costPerKm = costPerKmStr ? parseFloat(costPerKmStr.replace(/[^0-9.]/g, '')) : undefined;
        if (costPerKmStr && (isNaN(costPerKm!) || costPerKm! < 0)) {
          throw new Error('Cost Per Km must be a valid non-negative number');
        }

        const isActive = isActiveStr === 'yes' || isActiveStr === 'true' || isActiveStr === '1';

        // Check for duplicate route
        const existingRoute = await this.prisma.route.findFirst({
          where: {
            fromCity: { equals: fromCity, mode: 'insensitive' },
            toCity: { equals: toCity, mode: 'insensitive' },
          },
        });

        if (existingRoute) {
          throw new Error(`Route from "${fromCity}" to "${toCity}" already exists`);
        }

        // Create route
        const route = await this.prisma.route.create({
          data: {
            fromCity,
            toCity,
            distanceKm: new Decimal(distanceKm),
            timeHours: timeHours ? new Decimal(timeHours) : undefined,
            costPerKm: costPerKm ? new Decimal(costPerKm) : undefined,
            notes,
            isActive,
            createdByUserId: userId,
          },
        });

        results.success.push({ row: i + 1, fromCity, toCity });
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  // Route Request methods
  async createRouteRequest(dto: CreateRouteRequestDto, userId: string) {
    // Validate warehouse if provided
    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!warehouse) {
        throw new BadRequestException('Warehouse not found');
      }
    }

    // Validate quote if provided
    if (dto.quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: dto.quoteId },
      });
      if (!quote) {
        throw new BadRequestException('Quote not found');
      }
    }

    return this.prisma.routeRequest.create({
      data: {
        fromCity: dto.fromCity,
        toCity: dto.toCity,
        distanceKm: dto.distanceKm ? new Decimal(dto.distanceKm) : null,
        timeHours: dto.timeHours ? new Decimal(dto.timeHours) : null,
        warehouseId: dto.warehouseId,
        notes: dto.notes,
        quoteId: dto.quoteId,
        requestedByUserId: userId,
        status: RouteRequestStatus.PENDING,
      },
      include: {
        warehouse: { select: { id: true, name: true, locationCity: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        quote: { select: { id: true, quoteNumber: true } },
      },
    });
  }

  async findAllRouteRequests(page = 1, limit = 20, status?: RouteRequestStatus) {
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

  async findOneRouteRequest(id: string) {
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
      throw new NotFoundException('Route request not found');
    }

    return request;
  }

  async reviewRouteRequest(id: string, dto: ReviewRouteRequestDto, reviewerId: string) {
    const request = await this.prisma.routeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Route request not found');
    }

    if (request.status !== RouteRequestStatus.PENDING) {
      throw new BadRequestException('Route request has already been reviewed');
    }

    // If approved, create the route
    if (dto.status === RouteRequestStatus.APPROVED) {
      // Validate that required fields are present (admin should have filled them in)
      if (!request.fromCity || !request.toCity || !request.distanceKm) {
        throw new BadRequestException('Cannot approve route request: fromCity, toCity, and distanceKm must be filled in before approval');
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

      // Update request status and link to approved route
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

      // If this route request was associated with a quote, automatically apply the route to that quote
      if (request.quoteId) {
        await this.prisma.quote.update({
          where: { id: request.quoteId },
          data: { routeId: route.id },
        });
      }

      return { request: await this.findOneRouteRequest(id), route };
    }

    // If rejected, just update the request
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

  async deleteRouteRequest(id: string) {
    const request = await this.prisma.routeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Route request not found');
    }

    // Only allow deleting rejected requests
    if (request.status !== RouteRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected route requests can be deleted');
    }

    return this.prisma.routeRequest.delete({
      where: { id },
    });
  }
}
