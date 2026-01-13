import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
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
      this.prisma.productType.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productType.count({ where }),
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
    const productType = await this.prisma.productType.findUnique({
      where: { id },
    });

    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    return productType;
  }

  async create(dto: CreateProductTypeDto) {
    const existing = await this.prisma.productType.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Product type with this name already exists');
    }

    return this.prisma.productType.create({
      data: {
        name: dto.name,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateProductTypeDto) {
    const productType = await this.findOne(id);

    if (dto.name && dto.name !== productType.name) {
      const existing = await this.prisma.productType.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Product type with this name already exists');
      }
    }

    return this.prisma.productType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const productType = await this.findOne(id);

    const outputCount = await this.prisma.crusherOutputEntry.count({
      where: { productTypeId: id },
    });

    const stockCount = await this.prisma.stockLevel.count({
      where: { productTypeId: id },
    });

    if (outputCount > 0 || stockCount > 0) {
      throw new BadRequestException(
        `Cannot delete product type with ${outputCount + stockCount} associated entries. Please deactivate it instead.`,
      );
    }

    return this.prisma.productType.delete({
      where: { id },
    });
  }
}
