import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateExcavatorDto } from './dto/create-excavator.dto';
import { UpdateExcavatorDto } from './dto/update-excavator.dto';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class ExcavatorsService {
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
      this.prisma.excavator.findMany({
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
      this.prisma.excavator.count({ where }),
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
    const excavator = await this.prisma.excavator.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!excavator) {
      throw new NotFoundException('Excavator not found');
    }

    return excavator;
  }

  async create(dto: CreateExcavatorDto) {
    // Check for duplicate name
    const existing = await this.prisma.excavator.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Excavator with this name already exists');
    }

    return this.prisma.excavator.create({
      data: {
        name: dto.name,
        bucketCapacity: dto.bucketCapacity,
        status: dto.status || EquipmentStatus.ACTIVE,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateExcavatorDto) {
    const excavator = await this.findOne(id);

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== excavator.name) {
      const existing = await this.prisma.excavator.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Excavator with this name already exists');
      }
    }

    return this.prisma.excavator.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const excavator = await this.findOne(id);

    // Check if excavator has entries
    const entryCount = await this.prisma.excavatorEntry.count({
      where: { excavatorId: id },
    });

    if (entryCount > 0) {
      throw new BadRequestException(
        `Cannot delete excavator with ${entryCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.excavator.delete({
      where: { id },
    });
  }
}
