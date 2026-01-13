import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class TrucksService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, status?: EquipmentStatus) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { notes: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.truck.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              entries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.truck.count({ where }),
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
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return truck;
  }

  async create(dto: CreateTruckDto) {
    const existing = await this.prisma.truck.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Truck with this name already exists');
    }

    return this.prisma.truck.create({
      data: {
        name: dto.name,
        loadCapacity: dto.loadCapacity,
        status: dto.status || EquipmentStatus.ACTIVE,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateTruckDto) {
    const truck = await this.findOne(id);

    if (dto.name && dto.name !== truck.name) {
      const existing = await this.prisma.truck.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Truck with this name already exists');
      }
    }

    return this.prisma.truck.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const truck = await this.findOne(id);

    const entryCount = await this.prisma.haulingEntry.count({
      where: { truckId: id },
    });

    if (entryCount > 0) {
      throw new BadRequestException(
        `Cannot delete truck with ${entryCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.truck.delete({
      where: { id },
    });
  }
}
