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
exports.StockLevelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let StockLevelsService = class StockLevelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPreviousDayClosingStock(date, productTypeId, stockpileLocationId) {
        const previousDate = new Date(date);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousStock = await this.prisma.stockLevel.findUnique({
            where: {
                date_productTypeId_stockpileLocationId: {
                    date: previousDate,
                    productTypeId,
                    stockpileLocationId,
                },
            },
        });
        return previousStock ? previousStock.closingStock : new library_1.Decimal(0);
    }
    async calculateProduced(date, productTypeId, stockpileLocationId) {
        const entries = await this.prisma.crusherOutputEntry.findMany({
            where: {
                date,
                productTypeId,
                stockpileLocationId,
                status: client_1.EntryStatus.APPROVED,
            },
        });
        return entries.reduce((sum, entry) => sum.plus(entry.outputTonnage), new library_1.Decimal(0));
    }
    calculateClosingStock(openingStock, produced, sold, adjustments) {
        return openingStock.plus(produced).minus(sold).plus(adjustments);
    }
    async findAll(page = 1, limit = 20, dateFrom, dateTo, productTypeId, stockpileLocationId) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom)
                where.date.gte = new Date(dateFrom);
            if (dateTo)
                where.date.lte = new Date(dateTo);
        }
        if (productTypeId)
            where.productTypeId = productTypeId;
        if (stockpileLocationId)
            where.stockpileLocationId = stockpileLocationId;
        const [items, total] = await Promise.all([
            this.prisma.stockLevel.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    productType: { select: { id: true, name: true } },
                    stockpileLocation: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ date: 'desc' }],
            }),
            this.prisma.stockLevel.count({ where }),
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
    async findOne(id) {
        const stockLevel = await this.prisma.stockLevel.findUnique({
            where: { id },
            include: {
                productType: true,
                stockpileLocation: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!stockLevel) {
            throw new common_1.NotFoundException('Stock level not found');
        }
        return stockLevel;
    }
    async getCurrentStock(productTypeId, stockpileLocationId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const where = { date: today };
        if (productTypeId)
            where.productTypeId = productTypeId;
        if (stockpileLocationId)
            where.stockpileLocationId = stockpileLocationId;
        return this.prisma.stockLevel.findMany({
            where,
            include: {
                productType: { select: { id: true, name: true } },
                stockpileLocation: { select: { id: true, name: true } },
            },
            orderBy: [
                { productType: { name: 'asc' } },
                { stockpileLocation: { name: 'asc' } },
            ],
        });
    }
    async createOrUpdate(dto, createdById) {
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const existing = await this.prisma.stockLevel.findUnique({
            where: {
                date_productTypeId_stockpileLocationId: {
                    date,
                    productTypeId: dto.productTypeId,
                    stockpileLocationId: dto.stockpileLocationId,
                },
            },
        });
        const openingStock = dto.openingStock !== undefined
            ? new library_1.Decimal(dto.openingStock)
            : await this.getPreviousDayClosingStock(date, dto.productTypeId, dto.stockpileLocationId);
        const produced = await this.calculateProduced(date, dto.productTypeId, dto.stockpileLocationId);
        const sold = dto.sold ? new library_1.Decimal(dto.sold) : new library_1.Decimal(0);
        const adjustments = dto.adjustments ? new library_1.Decimal(dto.adjustments) : new library_1.Decimal(0);
        const closingStock = this.calculateClosingStock(openingStock, produced, sold, adjustments);
        if (existing) {
            return this.prisma.stockLevel.update({
                where: { id: existing.id },
                data: {
                    openingStock,
                    produced,
                    sold,
                    adjustments,
                    adjustmentReason: dto.adjustmentReason,
                    closingStock,
                },
                include: {
                    productType: true,
                    stockpileLocation: true,
                },
            });
        }
        return this.prisma.stockLevel.create({
            data: {
                date,
                productTypeId: dto.productTypeId,
                stockpileLocationId: dto.stockpileLocationId,
                openingStock,
                produced,
                sold,
                adjustments,
                adjustmentReason: dto.adjustmentReason,
                closingStock,
                createdById,
            },
            include: {
                productType: true,
                stockpileLocation: true,
            },
        });
    }
    async adjustStock(id, dto, createdById) {
        const stockLevel = await this.findOne(id);
        const adjustments = new library_1.Decimal(dto.adjustments);
        const newAdjustments = stockLevel.adjustments.plus(adjustments);
        const closingStock = this.calculateClosingStock(stockLevel.openingStock, stockLevel.produced, stockLevel.sold, newAdjustments);
        return this.prisma.stockLevel.update({
            where: { id },
            data: {
                adjustments: newAdjustments,
                adjustmentReason: stockLevel.adjustmentReason
                    ? `${stockLevel.adjustmentReason}\n\n${dto.adjustmentReason}: ${dto.adjustments}`
                    : `${dto.adjustmentReason}: ${dto.adjustments}`,
                closingStock,
            },
            include: {
                productType: true,
                stockpileLocation: true,
            },
        });
    }
    async recalculateStock(date, productTypeId, stockpileLocationId) {
        date.setHours(0, 0, 0, 0);
        const stockLevel = await this.prisma.stockLevel.findUnique({
            where: {
                date_productTypeId_stockpileLocationId: {
                    date,
                    productTypeId,
                    stockpileLocationId,
                },
            },
        });
        if (!stockLevel) {
            throw new common_1.NotFoundException('Stock level not found for this date');
        }
        const produced = await this.calculateProduced(date, productTypeId, stockpileLocationId);
        const closingStock = this.calculateClosingStock(stockLevel.openingStock, produced, stockLevel.sold, stockLevel.adjustments);
        return this.prisma.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
                produced,
                closingStock,
            },
            include: {
                productType: true,
                stockpileLocation: true,
            },
        });
    }
};
exports.StockLevelsService = StockLevelsService;
exports.StockLevelsService = StockLevelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockLevelsService);
//# sourceMappingURL=stock-levels.service.js.map