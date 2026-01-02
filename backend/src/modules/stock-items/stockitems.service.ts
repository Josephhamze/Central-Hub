import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';

@Injectable()
export class StockItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string, warehouseId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.stockItem.findMany({
        where, skip, take: limit,
        include: { project: { select: { id: true, name: true } }, warehouse: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockItem.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { project: true, warehouse: true, _count: { select: { quoteItems: true } } },
    });
    if (!item) throw new NotFoundException('Stock item not found');
    return item;
  }

  async create(dto: CreateStockItemDto) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    if (dto.minUnitPrice > dto.defaultUnitPrice) {
      throw new BadRequestException('Min unit price cannot be greater than default unit price');
    }
    return this.prisma.stockItem.create({
      data: {
        ...dto,
        minUnitPrice: dto.minUnitPrice,
        defaultUnitPrice: dto.defaultUnitPrice,
        minOrderQty: dto.minOrderQty,
      },
    });
  }

  async update(id: string, dto: UpdateStockItemDto) {
    const item = await this.prisma.stockItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Stock item not found');
    if (dto.minUnitPrice !== undefined && dto.defaultUnitPrice !== undefined && dto.minUnitPrice > dto.defaultUnitPrice) {
      throw new BadRequestException('Min unit price cannot be greater than default unit price');
    }
    return this.prisma.stockItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { _count: { select: { quoteItems: true } } },
    });
    if (!item) throw new NotFoundException('Stock item not found');
    if (item._count.quoteItems > 0) {
      throw new BadRequestException('Cannot delete stock item with associated quote items');
    }
    return this.prisma.stockItem.delete({ where: { id } });
  }
}
