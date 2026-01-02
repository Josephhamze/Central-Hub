import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.route.findMany({
        skip, take: limit,
        include: { tolls: true, _count: { select: { quotes: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.route.count(),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: { tolls: true, _count: { select: { quotes: true } } },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({ data: dto });
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
