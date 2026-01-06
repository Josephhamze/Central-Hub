import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTollStationDto } from './dto/create-toll-station.dto';
import { UpdateTollStationDto } from './dto/update-toll-station.dto';
import { CreateTollRateDto } from './dto/create-toll-rate.dto';
import { UpdateTollRateDto } from './dto/update-toll-rate.dto';

@Injectable()
export class TollStationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: { isActive?: boolean; search?: string }) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { cityOrArea: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tollStation.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          rates: { where: { isActive: true }, orderBy: { vehicleType: 'asc' } },
          _count: { select: { routeStations: true, payments: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.tollStation.count({ where }),
    ]);

    return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
  }

  async findOne(id: string) {
    const station = await this.prisma.tollStation.findUnique({
      where: { id },
      include: {
        rates: { orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }] },
        _count: { select: { routeStations: true, payments: true } },
      },
    });
    if (!station) throw new NotFoundException('Toll station not found');
    return station;
  }

  async create(dto: CreateTollStationDto) {
    if (dto.code) {
      const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('Toll station code already exists');
    }
    return this.prisma.tollStation.create({
      data: {
        ...dto,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateTollStationDto) {
    const station = await this.prisma.tollStation.findUnique({ where: { id } });
    if (!station) throw new NotFoundException('Toll station not found');

    if (dto.code && dto.code !== station.code) {
      const existing = await this.prisma.tollStation.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('Toll station code already exists');
    }

    return this.prisma.tollStation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const station = await this.prisma.tollStation.findUnique({
      where: { id },
      include: { _count: { select: { routeStations: true, payments: true } } },
    });
    if (!station) throw new NotFoundException('Toll station not found');
    if (station._count.routeStations > 0 || station._count.payments > 0) {
      throw new BadRequestException('Cannot delete toll station with associated routes or payments');
    }
    return this.prisma.tollStation.delete({ where: { id } });
  }

  // Toll Rate Management
  async createRate(tollStationId: string, dto: CreateTollRateDto) {
    const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
    if (!station) throw new NotFoundException('Toll station not found');

    // Check for overlapping effective dates
    if (dto.effectiveFrom || dto.effectiveTo) {
      const overlapping = await this.prisma.tollRate.findFirst({
        where: {
          tollStationId,
          vehicleType: dto.vehicleType,
          isActive: true,
          OR: [
            {
              AND: [
                { effectiveFrom: { lte: dto.effectiveTo ? new Date(dto.effectiveTo) : new Date('2099-12-31') } },
                { effectiveTo: { gte: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date('1970-01-01') } },
              ],
            },
            {
              AND: [
                { effectiveFrom: null },
                { effectiveTo: null },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException('Overlapping effective date range for this vehicle type');
      }
    }

    return this.prisma.tollRate.create({
      data: {
        ...dto,
        tollStationId,
        currency: dto.currency || 'USD',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async updateRate(tollStationId: string, rateId: string, dto: UpdateTollRateDto) {
    const rate = await this.prisma.tollRate.findUnique({
      where: { id: rateId },
    });
    if (!rate || rate.tollStationId !== tollStationId) {
      throw new NotFoundException('Toll rate not found');
    }

    return this.prisma.tollRate.update({
      where: { id: rateId },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async removeRate(tollStationId: string, rateId: string) {
    const rate = await this.prisma.tollRate.findUnique({
      where: { id: rateId },
    });
    if (!rate || rate.tollStationId !== tollStationId) {
      throw new NotFoundException('Toll rate not found');
    }
    return this.prisma.tollRate.delete({ where: { id: rateId } });
  }

  async getRates(tollStationId: string, vehicleType?: string) {
    const station = await this.prisma.tollStation.findUnique({ where: { id: tollStationId } });
    if (!station) throw new NotFoundException('Toll station not found');

    const where: any = { tollStationId };
    if (vehicleType) where.vehicleType = vehicleType;

    return this.prisma.tollRate.findMany({
      where,
      orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }
}
