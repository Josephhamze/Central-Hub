import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCrusherDto } from './dto/create-crusher.dto';
import { UpdateCrusherDto } from './dto/update-crusher.dto';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class CrushersService {
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
      this.prisma.crusher.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              feedEntries: true,
              outputEntries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crusher.count({ where }),
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
    const crusher = await this.prisma.crusher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            feedEntries: true,
            outputEntries: true,
          },
        },
      },
    });

    if (!crusher) {
      throw new NotFoundException('Crusher not found');
    }

    return crusher;
  }

  async create(dto: CreateCrusherDto) {
    const existing = await this.prisma.crusher.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Crusher with this name already exists');
    }

    return this.prisma.crusher.create({
      data: {
        name: dto.name,
        type: dto.type,
        ratedCapacity: dto.ratedCapacity,
        status: dto.status || EquipmentStatus.ACTIVE,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateCrusherDto) {
    const crusher = await this.findOne(id);

    if (dto.name && dto.name !== crusher.name) {
      const existing = await this.prisma.crusher.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Crusher with this name already exists');
      }
    }

    return this.prisma.crusher.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const crusher = await this.findOne(id);

    const feedCount = await this.prisma.crusherFeedEntry.count({
      where: { crusherId: id },
    });

    const outputCount = await this.prisma.crusherOutputEntry.count({
      where: { crusherId: id },
    });

    if (feedCount > 0 || outputCount > 0) {
      throw new BadRequestException(
        `Cannot delete crusher with ${feedCount + outputCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.crusher.delete({
      where: { id },
    });
  }
}
