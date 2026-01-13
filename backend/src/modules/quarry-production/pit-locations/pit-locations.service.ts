import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreatePitLocationDto } from './dto/create-pit-location.dto';
import { UpdatePitLocationDto } from './dto/update-pit-location.dto';

@Injectable()
export class PitLocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, isActive?: boolean) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.pitLocation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pitLocation.count({ where }),
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
    const pitLocation = await this.prisma.pitLocation.findUnique({
      where: { id },
    });

    if (!pitLocation) {
      throw new NotFoundException('Pit location not found');
    }

    return pitLocation;
  }

  async create(dto: CreatePitLocationDto) {
    const existing = await this.prisma.pitLocation.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Pit location with this name already exists');
    }

    return this.prisma.pitLocation.create({
      data: {
        name: dto.name,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdatePitLocationDto) {
    const pitLocation = await this.findOne(id);

    if (dto.name && dto.name !== pitLocation.name) {
      const existing = await this.prisma.pitLocation.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Pit location with this name already exists');
      }
    }

    return this.prisma.pitLocation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const pitLocation = await this.findOne(id);

    const entryCount = await this.prisma.excavatorEntry.count({
      where: { pitLocationId: id },
    });

    if (entryCount > 0) {
      throw new BadRequestException(
        `Cannot delete pit location with ${entryCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.pitLocation.delete({
      where: { id },
    });
  }
}
