import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Injectable()
export class SparePartsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, warehouseId?: string) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (warehouseId) where.warehouseId = warehouseId;

    const [items, total] = await Promise.all([
      this.prisma.sparePart.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          warehouse: {
            select: { id: true, name: true },
          },
          _count: {
            select: { partUsages: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.sparePart.count({ where }),
    ]);

    // Add low stock flag
    const itemsWithFlags = items.map((item) => ({
      ...item,
      isLowStock: Number(item.quantityOnHand) <= Number(item.minStockLevel),
    }));

    return {
      items: itemsWithFlags,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const part = await this.prisma.sparePart.findUnique({
      where: { id },
      include: {
        warehouse: true,
        partUsages: {
          include: {
            workOrder: {
              select: { id: true, description: true, completedAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    return {
      ...part,
      isLowStock: Number(part.quantityOnHand) <= Number(part.minStockLevel),
    };
  }

  async create(dto: CreateSparePartDto) {
    // Check SKU uniqueness
    const existing = await this.prisma.sparePart.findUnique({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new BadRequestException('SKU already exists');
    }

    // Validate warehouse
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }

    const part = await this.prisma.sparePart.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        uom: dto.uom,
        warehouseId: dto.warehouseId,
        quantityOnHand: dto.quantityOnHand || 0,
        minStockLevel: dto.minStockLevel || 0,
        unitCost: dto.unitCost,
        isCritical: dto.isCritical || false,
      },
      include: {
        warehouse: {
          select: { id: true, name: true },
        },
      },
    });

    return part;
  }

  async update(id: string, dto: UpdateSparePartDto) {
    const part = await this.prisma.sparePart.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    // Check SKU uniqueness if changing
    if (dto.sku && dto.sku !== part.sku) {
      const existing = await this.prisma.sparePart.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new BadRequestException('SKU already exists');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.uom !== undefined) updateData.uom = dto.uom;
    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.quantityOnHand !== undefined) updateData.quantityOnHand = dto.quantityOnHand;
    if (dto.minStockLevel !== undefined) updateData.minStockLevel = dto.minStockLevel;
    if (dto.unitCost !== undefined) updateData.unitCost = dto.unitCost;
    if (dto.isCritical !== undefined) updateData.isCritical = dto.isCritical;

    const updated = await this.prisma.sparePart.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: {
          select: { id: true, name: true },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const part = await this.prisma.sparePart.findUnique({
      where: { id },
      include: {
        _count: {
          select: { partUsages: true },
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    if (part._count.partUsages > 0) {
      throw new BadRequestException('Cannot delete spare part with usage history');
    }

    await this.prisma.sparePart.delete({
      where: { id },
    });

    return { message: 'Spare part deleted successfully' };
  }

  async getLowStock() {
    // Get all parts and filter in memory (Prisma limitation)
    const allParts = await this.prisma.sparePart.findMany({
      include: {
        warehouse: {
          select: { id: true, name: true },
        },
      },
    });

    const parts = allParts.filter(
      (part) => Number(part.quantityOnHand) <= Number(part.minStockLevel)
    );
      include: {
        warehouse: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isCritical: 'desc' },
        { quantityOnHand: 'asc' },
      ],
    });

    return parts;
  }
}
