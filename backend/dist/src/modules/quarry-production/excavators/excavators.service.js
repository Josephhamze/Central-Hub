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
exports.ExcavatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let ExcavatorsService = class ExcavatorsService {
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
            this.prisma.excavator.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    _count: {
                        select: {
                            entries: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.excavator.count({ where }),
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
        const excavator = await this.prisma.excavator.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        entries: true,
                    },
                },
            },
        });
        if (!excavator) {
            throw new common_1.NotFoundException('Excavator not found');
        }
        return excavator;
    }
    async create(dto) {
        const existing = await this.prisma.excavator.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.BadRequestException('Excavator with this name already exists');
        }
        return this.prisma.excavator.create({
            data: {
                name: dto.name,
                bucketCapacity: dto.bucketCapacity,
                status: dto.status || client_1.EquipmentStatus.ACTIVE,
                notes: dto.notes,
            },
        });
    }
    async update(id, dto) {
        const excavator = await this.findOne(id);
        if (dto.name && dto.name !== excavator.name) {
            const existing = await this.prisma.excavator.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.BadRequestException('Excavator with this name already exists');
            }
        }
        return this.prisma.excavator.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const excavator = await this.findOne(id);
        const entryCount = await this.prisma.excavatorEntry.count({
            where: { excavatorId: id },
        });
        if (entryCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete excavator with ${entryCount} associated entries. Please deactivate it instead.`);
        }
        return this.prisma.excavator.delete({
            where: { id },
        });
    }
};
exports.ExcavatorsService = ExcavatorsService;
exports.ExcavatorsService = ExcavatorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExcavatorsService);
//# sourceMappingURL=excavators.service.js.map