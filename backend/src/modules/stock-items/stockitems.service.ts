import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';

@Injectable()
export class StockItemsService {
  constructor(private prisma: PrismaService) {}


  /**
   * Generate a unique SKU from product name
   */
  private generateSku(name: string): string {
    // Convert name to uppercase, remove special chars, replace spaces with hyphens
    const base = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    
    // Add timestamp suffix for uniqueness
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    return `${base}-${timestamp}`;
  }


  async findAll(projectId?: string, warehouseId?: string, page = 1, limit = 20, search?: string) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;
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
        where, skip, take: limitNum,
        include: { project: { select: { id: true, name: true } }, warehouse: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockItem.count({ where }),
    ]);
    return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
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
    
    // Auto-generate SKU if not provided
    const sku = dto.sku?.trim() || this.generateSku(dto.name);
    
    // Filter out fields that don't exist in the schema (description, companyId)
    const { description, companyId, ...prismaData } = dto;
    
    return this.prisma.stockItem.create({
      data: {
        ...prismaData,
        sku,
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
