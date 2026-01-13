"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let StockItemsService = class StockItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSku(name) {
        const base = name
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 20);
        const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
        return `${base}-${timestamp}`;
    }
    async findAll(companyId, projectId, warehouseId, page = 1, limit = 20, search) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (companyId) {
            where.project = { companyId };
        }
        if (projectId)
            where.projectId = projectId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
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
    async findOne(id) {
        const item = await this.prisma.stockItem.findUnique({
            where: { id },
            include: { project: true, warehouse: true, _count: { select: { quoteItems: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Stock item not found');
        return item;
    }
    async create(dto) {
        const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        if (dto.minUnitPrice > dto.defaultUnitPrice) {
            throw new common_1.BadRequestException('Min unit price cannot be greater than default unit price');
        }
        const sku = dto.sku?.trim() || this.generateSku(dto.name);
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
    async update(id, dto) {
        const item = await this.prisma.stockItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Stock item not found');
        if (dto.minUnitPrice !== undefined && dto.defaultUnitPrice !== undefined && dto.minUnitPrice > dto.defaultUnitPrice) {
            throw new common_1.BadRequestException('Min unit price cannot be greater than default unit price');
        }
        return this.prisma.stockItem.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const item = await this.prisma.stockItem.findUnique({
            where: { id },
            include: { _count: { select: { quoteItems: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Stock item not found');
        if (item._count.quoteItems > 0) {
            throw new common_1.BadRequestException('Cannot delete stock item with associated quote items');
        }
        return this.prisma.stockItem.delete({ where: { id } });
    }
    async bulkImport(file) {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length < 2) {
            throw new common_1.BadRequestException('Excel file must contain at least a header row and one data row');
        }
        const headers = data[0];
        const expectedHeaders = ['Project Name', 'Warehouse Name', 'Name', 'SKU', 'Description', 'UOM', 'Min Unit Price', 'Default Unit Price', 'Min Order Qty', 'Truckload Only', 'Is Active'];
        const normalizedHeaders = headers.map(h => h?.toString().trim());
        const headerMap = {};
        expectedHeaders.forEach((expected, idx) => {
            const foundIdx = normalizedHeaders.findIndex(h => h?.toLowerCase() === expected.toLowerCase());
            if (foundIdx === -1 && idx < 3) {
                throw new common_1.BadRequestException(`Missing required column: ${expected}`);
            }
            if (foundIdx !== -1) {
                headerMap[expected] = foundIdx;
            }
        });
        const results = {
            success: [],
            errors: [],
        };
        const [projects, warehouses] = await Promise.all([
            this.prisma.project.findMany({ select: { id: true, name: true } }),
            this.prisma.warehouse.findMany({ select: { id: true, name: true } }),
        ]);
        const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p.id]));
        const warehouseMap = new Map(warehouses.map(w => [w.name.toLowerCase(), w.id]));
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell || cell.toString().trim() === ''))
                continue;
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
                if (!projectName)
                    throw new Error('Project Name is required');
                if (!warehouseName)
                    throw new Error('Warehouse Name is required');
                if (!name)
                    throw new Error('Name is required');
                if (!uom)
                    throw new Error('UOM is required');
                if (isNaN(minUnitPrice) || minUnitPrice < 0)
                    throw new Error('Min Unit Price must be a valid number');
                if (isNaN(defaultUnitPrice) || defaultUnitPrice < 0)
                    throw new Error('Default Unit Price must be a valid number');
                if (isNaN(minOrderQty) || minOrderQty <= 0)
                    throw new Error('Min Order Qty must be a valid positive number');
                if (minUnitPrice > defaultUnitPrice)
                    throw new Error('Min Unit Price cannot be greater than Default Unit Price');
                const projectId = projectMap.get(projectName.toLowerCase());
                if (!projectId)
                    throw new Error(`Project "${projectName}" not found`);
                const warehouseId = warehouseMap.get(warehouseName.toLowerCase());
                if (!warehouseId)
                    throw new Error(`Warehouse "${warehouseName}" not found`);
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
            }
            catch (error) {
                results.errors.push({
                    row: i + 1,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return results;
    }
};
exports.StockItemsService = StockItemsService;
exports.StockItemsService = StockItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockItemsService);
//# sourceMappingURL=stockitems.service.js.map