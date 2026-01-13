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
exports.SparePartsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let SparePartsService = class SparePartsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, search, warehouseId) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (warehouseId)
            where.warehouseId = warehouseId;
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Spare part not found');
        }
        return {
            ...part,
            isLowStock: Number(part.quantityOnHand) <= Number(part.minStockLevel),
        };
    }
    async create(dto) {
        const existing = await this.prisma.sparePart.findUnique({
            where: { sku: dto.sku },
        });
        if (existing) {
            throw new common_1.BadRequestException('SKU already exists');
        }
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id: dto.warehouseId },
        });
        if (!warehouse) {
            throw new common_1.BadRequestException('Warehouse not found');
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
    async update(id, dto) {
        const part = await this.prisma.sparePart.findUnique({
            where: { id },
        });
        if (!part) {
            throw new common_1.NotFoundException('Spare part not found');
        }
        if (dto.sku && dto.sku !== part.sku) {
            const existing = await this.prisma.sparePart.findUnique({
                where: { sku: dto.sku },
            });
            if (existing) {
                throw new common_1.BadRequestException('SKU already exists');
            }
        }
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.sku !== undefined)
            updateData.sku = dto.sku;
        if (dto.uom !== undefined)
            updateData.uom = dto.uom;
        if (dto.warehouseId !== undefined)
            updateData.warehouseId = dto.warehouseId;
        if (dto.quantityOnHand !== undefined)
            updateData.quantityOnHand = dto.quantityOnHand;
        if (dto.minStockLevel !== undefined)
            updateData.minStockLevel = dto.minStockLevel;
        if (dto.unitCost !== undefined)
            updateData.unitCost = dto.unitCost;
        if (dto.isCritical !== undefined)
            updateData.isCritical = dto.isCritical;
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
    async remove(id) {
        const part = await this.prisma.sparePart.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { partUsages: true },
                },
            },
        });
        if (!part) {
            throw new common_1.NotFoundException('Spare part not found');
        }
        if (part._count.partUsages > 0) {
            throw new common_1.BadRequestException('Cannot delete spare part with usage history');
        }
        await this.prisma.sparePart.delete({
            where: { id },
        });
        return { message: 'Spare part deleted successfully' };
    }
    async getLowStock() {
        const allParts = await this.prisma.sparePart.findMany({
            include: {
                warehouse: {
                    select: { id: true, name: true },
                },
            },
        });
        const parts = allParts.filter((part) => Number(part.quantityOnHand) <= Number(part.minStockLevel));
        parts.sort((a, b) => {
            if (a.isCritical !== b.isCritical) {
                return a.isCritical ? -1 : 1;
            }
            return Number(a.quantityOnHand) - Number(b.quantityOnHand);
        });
        return parts;
    }
};
exports.SparePartsService = SparePartsService;
exports.SparePartsService = SparePartsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SparePartsService);
//# sourceMappingURL=spare-parts.service.js.map