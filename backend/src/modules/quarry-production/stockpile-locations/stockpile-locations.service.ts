import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateStockpileLocationDto } from './dto/create-stockpile-location.dto';
import { UpdateStockpileLocationDto } from './dto/update-stockpile-location.dto';

@Injectable()
export class StockpileLocationsService {
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
      this.prisma.stockpileLocation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockpileLocation.count({ where }),
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
    const stockpileLocation = await this.prisma.stockpileLocation.findUnique({
      where: { id },
    });

    if (!stockpileLocation) {
      throw new NotFoundException('Stockpile location not found');
    }

    return stockpileLocation;
  }

  async create(dto: CreateStockpileLocationDto) {
    const existing = await this.prisma.stockpileLocation.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Stockpile location with this name already exists');
    }

    return this.prisma.stockpileLocation.create({
      data: {
        name: dto.name,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateStockpileLocationDto) {
    const stockpileLocation = await this.findOne(id);

    if (dto.name && dto.name !== stockpileLocation.name) {
      const existing = await this.prisma.stockpileLocation.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Stockpile location with this name already exists');
      }
    }

    return this.prisma.stockpileLocation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const stockpileLocation = await this.findOne(id);

    const outputCount = await this.prisma.crusherOutputEntry.count({
      where: { stockpileLocationId: id },
    });

    const stockCount = await this.prisma.stockLevel.count({
      where: { stockpileLocationId: id },
    });

    if (outputCount > 0 || stockCount > 0) {
      throw new BadRequestException(
        `Cannot delete stockpile location with ${outputCount + stockCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.stockpileLocation.delete({
      where: { id },
    });
  }
}
