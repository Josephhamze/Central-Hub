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


  async findAll(companyId?: string, projectId?: string, warehouseId?: string, page = 1, limit = 20, search?: string) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (companyId) {
      // Filter by companyId through the project relation
      where.project = { companyId };
    }
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
        include: { 
          project: { 
            select: { id: true, name: true, companyId: true }
          }, 
          warehouse: { select: { id: true, name: true } } 
        },
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


  async bulkImport(file: any) {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new BadRequestException('Excel file must contain at least a header row and one data row');
    }

    // Expected headers: Project Name, Warehouse Name, Name, SKU, Description, UOM, Min Unit Price, Default Unit Price, Min Order Qty, Truckload Only, Is Active
    const headers = data[0] as string[];
    const expectedHeaders = ['Project Name', 'Warehouse Name', 'Name', 'SKU', 'Description', 'UOM', 'Min Unit Price', 'Default Unit Price', 'Min Order Qty', 'Truckload Only', 'Is Active'];
    
    // Validate headers (case-insensitive)
    const normalizedHeaders = headers.map(h => h?.toString().trim());
    const headerMap: Record<string, number> = {};
    expectedHeaders.forEach((expected, idx) => {
      const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
      if (foundIdx === -1 && idx < 3) { // First 3 are required
        throw new BadRequestException(`Missing required column: ${expected}`);
      }
      if (foundIdx !== -1) {
        headerMap[expected] = foundIdx;
      }
    });

    const results = {
      success: [] as any[],
      errors: [] as { row: number; error: string }[],
    };

    // Get all projects and warehouses for lookup
    const [projects, warehouses] = await Promise.all([
      this.prisma.project.findMany({ select: { id: true, name: true } }),
      this.prisma.warehouse.findMany({ select: { id: true, name: true } }),
    ]);

    const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p.id]));
    const warehouseMap = new Map(warehouses.map(w => [w.name.toLowerCase(), w.id]));

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue; // Skip empty rows

      try {
        const projectName = row[headerMap['Project Name']]?.toString().trim();
        const warehouseName = row[headerMap['Warehouse Name']]?.toString().trim();
        const name = row[headerMap['Name']]?.toString().trim();
        const sku = row[headerMap['SKU']]?.toString().trim() || undefined;
        const description = row[headerMap['Description']]?.toString().trim() || undefined;
        const uom = row[headerMap['UOM']]?.toString().trim();
        const minUnitPrice = parseFloat(row[headerMap['Min Unit Price']]?.toString().replace(/[^0-9.]/g, '') || '0');
        const defaultUnitPrice = parseFloat(row[headerMap['Default Unit Price']]?.toString().replace(/[^0-9.]/g, '') || '0');
        const minOrderQty = parseFloat(row[headerMap['Min Order Qty']]?.toString().replace(/[^0-9.]/g, '') || '1');
        const truckloadOnly = (row[headerMap['Truckload Only']]?.toString().trim().toLowerCase() || 'no') === 'yes';
        const isActive = (row[headerMap['Is Active']]?.toString().trim().toLowerCase() || 'yes') === 'yes';

        // Validation
        if (!projectName) throw new Error('Project Name is required');
        if (!warehouseName) throw new Error('Warehouse Name is required');
        if (!name) throw new Error('Name is required');
        if (!uom) throw new Error('UOM is required');
        if (isNaN(minUnitPrice) || minUnitPrice < 0) throw new Error('Min Unit Price must be a valid number');
        if (isNaN(defaultUnitPrice) || defaultUnitPrice < 0) throw new Error('Default Unit Price must be a valid number');
        if (isNaN(minOrderQty) || minOrderQty <= 0) throw new Error('Min Order Qty must be a valid positive number');
        if (minUnitPrice > defaultUnitPrice) throw new Error('Min Unit Price cannot be greater than Default Unit Price');

        const projectId = projectMap.get(projectName.toLowerCase());
        if (!projectId) throw new Error(`Project "${projectName}" not found`);

        const warehouseId = warehouseMap.get(warehouseName.toLowerCase());
        if (!warehouseId) throw new Error(`Warehouse "${warehouseName}" not found`);

        // Create stock item
        const finalSku = sku || this.generateSku(name);
        const stockItem = await this.prisma.stockItem.create({
          data: {
            projectId,
            warehouseId,
            name,
            sku: finalSku,
            uom,
            minUnitPrice,
            defaultUnitPrice,
            minOrderQty,
            truckloadOnly,
            isActive,
          },
        });

        results.success.push({ row: i + 1, name, sku: finalSku });
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

}
