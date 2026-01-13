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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let WarehousesService = class WarehousesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, projectId, page = 1, limit = 20) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (companyId)
            where.companyId = companyId;
        if (projectId)
            where.projectId = projectId;
        const [items, total] = await Promise.all([
            this.prisma.warehouse.findMany({
                where, skip, take: limitNum,
                include: { company: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.warehouse.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            include: { company: true, project: true, stockItems: { where: { isActive: true }, take: 10 } },
        });
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        return warehouse;
    }
    async create(dto) {
        const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        if (dto.projectId) {
            const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
            if (!project)
                throw new common_1.NotFoundException('Project not found');
        }
        return this.prisma.warehouse.create({ data: dto });
    }
    async update(id, dto) {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        return this.prisma.warehouse.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            include: { _count: { select: { stockItems: true } } },
        });
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        if (warehouse._count.stockItems > 0) {
            throw new common_1.BadRequestException('Cannot delete warehouse with associated stock items');
        }
        return this.prisma.warehouse.delete({ where: { id } });
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map