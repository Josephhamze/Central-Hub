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
exports.StockpileLocationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let StockpileLocationsService = class StockpileLocationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, search, isActive) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
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
    async findOne(id) {
        const stockpileLocation = await this.prisma.stockpileLocation.findUnique({
            where: { id },
        });
        if (!stockpileLocation) {
            throw new common_1.NotFoundException('Stockpile location not found');
        }
        return stockpileLocation;
    }
    async create(dto) {
        const existing = await this.prisma.stockpileLocation.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.BadRequestException('Stockpile location with this name already exists');
        }
        return this.prisma.stockpileLocation.create({
            data: {
                name: dto.name,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }
    async update(id, dto) {
        const stockpileLocation = await this.findOne(id);
        if (dto.name && dto.name !== stockpileLocation.name) {
            const existing = await this.prisma.stockpileLocation.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.BadRequestException('Stockpile location with this name already exists');
            }
        }
        return this.prisma.stockpileLocation.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const stockpileLocation = await this.findOne(id);
        const outputCount = await this.prisma.crusherOutputEntry.count({
            where: { stockpileLocationId: id },
        });
        const stockCount = await this.prisma.stockLevel.count({
            where: { stockpileLocationId: id },
        });
        if (outputCount > 0 || stockCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete stockpile location with ${outputCount + stockCount} associated entries. Please deactivate it instead.`);
        }
        return this.prisma.stockpileLocation.delete({
            where: { id },
        });
    }
};
exports.StockpileLocationsService = StockpileLocationsService;
exports.StockpileLocationsService = StockpileLocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockpileLocationsService);
//# sourceMappingURL=stockpile-locations.service.js.map