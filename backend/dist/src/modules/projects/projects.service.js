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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateProjectCode(name) {
        const base = name
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 15);
        const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
        return `${base}-${timestamp}`;
    }
    async findAll(companyId, page = 1, limit = 20) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = companyId ? { companyId } : {};
        const [items, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                skip,
                take: limitNum,
                include: { company: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.project.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                company: true,
                warehouses: { where: { isActive: true } },
                stockItems: { where: { isActive: true }, take: 10 },
                _count: { select: { quotes: true } },
            },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return project;
    }
    async create(dto) {
        const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const code = dto.code?.trim() || this.generateProjectCode(dto.name);
        const { description, startDate, endDate, status, ...prismaData } = dto;
        return this.prisma.project.create({
            data: {
                ...prismaData,
                code,
            }
        });
    }
    async update(id, dto) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return this.prisma.project.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: { _count: { select: { warehouses: true, stockItems: true, quotes: true } } },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project._count.warehouses > 0 || project._count.stockItems > 0 || project._count.quotes > 0) {
            throw new common_1.BadRequestException('Cannot delete project with associated data');
        }
        return this.prisma.project.delete({ where: { id } });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map