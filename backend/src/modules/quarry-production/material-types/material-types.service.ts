import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';

@Injectable()
export class MaterialTypesService {
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
      this.prisma.materialType.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.materialType.count({ where }),
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
    const materialType = await this.prisma.materialType.findUnique({
      where: { id },
    });

    if (!materialType) {
      throw new NotFoundException('Material type not found');
    }

    return materialType;
  }

  async create(dto: CreateMaterialTypeDto) {
    const existing = await this.prisma.materialType.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Material type with this name already exists');
    }

    return this.prisma.materialType.create({
      data: {
        name: dto.name,
        density: dto.density,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateMaterialTypeDto) {
    const materialType = await this.findOne(id);

    if (dto.name && dto.name !== materialType.name) {
      const existing = await this.prisma.materialType.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Material type with this name already exists');
      }
    }

    return this.prisma.materialType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const materialType = await this.findOne(id);

    const excavatorCount = await this.prisma.excavatorEntry.count({
      where: { materialTypeId: id },
    });

    const feedCount = await this.prisma.crusherFeedEntry.count({
      where: { materialTypeId: id },
    });

    if (excavatorCount > 0 || feedCount > 0) {
      throw new BadRequestException(
        `Cannot delete material type with ${excavatorCount + feedCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.materialType.delete({
      where: { id },
    });
  }
}
