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
exports.CrushersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let CrushersService = class CrushersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, search, status) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [items, total] = await Promise.all([
            this.prisma.crusher.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    _count: {
                        select: {
                            feedEntries: true,
                            outputEntries: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.crusher.count({ where }),
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
        const crusher = await this.prisma.crusher.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        feedEntries: true,
                        outputEntries: true,
                    },
                },
            },
        });
        if (!crusher) {
            throw new common_1.NotFoundException('Crusher not found');
        }
        return crusher;
    }
    async create(dto) {
        const existing = await this.prisma.crusher.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.BadRequestException('Crusher with this name already exists');
        }
        return this.prisma.crusher.create({
            data: {
                name: dto.name,
                type: dto.type,
                ratedCapacity: dto.ratedCapacity,
                status: dto.status || client_1.EquipmentStatus.ACTIVE,
                notes: dto.notes,
            },
        });
    }
    async update(id, dto) {
        const crusher = await this.findOne(id);
        if (dto.name && dto.name !== crusher.name) {
            const existing = await this.prisma.crusher.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.BadRequestException('Crusher with this name already exists');
            }
        }
        return this.prisma.crusher.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const crusher = await this.findOne(id);
        const feedCount = await this.prisma.crusherFeedEntry.count({
            where: { crusherId: id },
        });
        const outputCount = await this.prisma.crusherOutputEntry.count({
            where: { crusherId: id },
        });
        if (feedCount > 0 || outputCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete crusher with ${feedCount + outputCount} associated entries. Please deactivate it instead.`);
        }
        return this.prisma.crusher.delete({
            where: { id },
        });
    }
};
exports.CrushersService = CrushersService;
exports.CrushersService = CrushersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrushersService);
//# sourceMappingURL=crushers.service.js.map