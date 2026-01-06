import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { SetRouteStationsDto } from './dto/set-route-stations.dto';
import { VehicleType } from '@prisma/client';
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

    // Validate all toll stations exist
    const stationIds = dto.stations.map((s) => s.tollStationId);
    const stations = await this.prisma.tollStation.findMany({
      where: { id: { in: stationIds } },
    });
    if (stations.length !== stationIds.length) {
      throw new BadRequestException('One or more toll stations not found');
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
    return this.prisma.route.create({
      data: {
        ...dto,
        createdByUserId: userId,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
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
}
