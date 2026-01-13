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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, search) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { legalName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.company.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.company.count({ where }),
        ]);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                projects: {
                    where: { isActive: true },
                    select: { id: true, name: true, code: true },
                },
                warehouses: {
                    where: { isActive: true },
                    select: { id: true, name: true, locationCity: true },
                },
                _count: {
                    select: {
                        quotes: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async create(dto) {
        return this.prisma.company.create({
            data: dto,
        });
    }
    async update(id, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const updateData = {};
        Object.keys(dto).forEach((key) => {
            const value = dto[key];
            if (value === null || value !== undefined) {
                updateData[key] = value;
            }
        });
        return this.prisma.company.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        projects: true,
                        warehouses: true,
                        quotes: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (company._count.projects > 0 || company._count.warehouses > 0 || company._count.quotes > 0) {
            throw new common_1.BadRequestException('Cannot delete company with associated projects, warehouses, or quotes');
        }
        return this.prisma.company.delete({
            where: { id },
        });
    }
    async uploadLogo(file) {
        try {
            if (!file.buffer) {
                throw new common_1.BadRequestException('File buffer is missing');
            }
            const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
            try {
                await fs.promises.mkdir(uploadsDir, { recursive: true, mode: 0o755 });
            }
            catch (mkdirError) {
                if (mkdirError.code !== 'EEXIST') {
                    console.error(`Failed to create uploads directory: ${mkdirError.message}`, mkdirError);
                    throw new common_1.BadRequestException(`Failed to create uploads directory: ${mkdirError.message}`);
                }
            }
            const fileExt = path.extname(file.originalname || '.png');
            const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
            const filePath = path.join(uploadsDir, fileName);
            await fs.promises.writeFile(filePath, file.buffer);
            const logoUrl = `/api/v1/uploads/logos/${fileName}`;
            return { logoUrl };
        }
        catch (error) {
            console.error('Error uploading logo:', error);
            throw new common_1.BadRequestException(`Failed to upload logo: ${error.message || 'Unknown error'}`);
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map