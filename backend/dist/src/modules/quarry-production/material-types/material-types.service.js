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
exports.MaterialTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let MaterialTypesService = class MaterialTypesService {
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
    async findOne(id) {
        const materialType = await this.prisma.materialType.findUnique({
            where: { id },
        });
        if (!materialType) {
            throw new common_1.NotFoundException('Material type not found');
        }
        return materialType;
    }
    async create(dto) {
        const existing = await this.prisma.materialType.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.BadRequestException('Material type with this name already exists');
        }
        return this.prisma.materialType.create({
            data: {
                name: dto.name,
                density: dto.density,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }
    async update(id, dto) {
        const materialType = await this.findOne(id);
        if (dto.name && dto.name !== materialType.name) {
            const existing = await this.prisma.materialType.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.BadRequestException('Material type with this name already exists');
            }
        }
        return this.prisma.materialType.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const materialType = await this.findOne(id);
        const excavatorCount = await this.prisma.excavatorEntry.count({
            where: { materialTypeId: id },
        });
        const feedCount = await this.prisma.crusherFeedEntry.count({
            where: { materialTypeId: id },
        });
        if (excavatorCount > 0 || feedCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete material type with ${excavatorCount + feedCount} associated entries. Please deactivate it instead.`);
        }
        return this.prisma.materialType.delete({
            where: { id },
        });
    }
};
exports.MaterialTypesService = MaterialTypesService;
exports.MaterialTypesService = MaterialTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialTypesService);
//# sourceMappingURL=material-types.service.js.map