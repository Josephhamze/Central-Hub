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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(type, page = 1, limit = 20, search) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (type)
            where.type = type;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.customer.findMany({
                where, skip, take: limitNum,
                include: { contacts: { where: { isPrimary: true }, take: 1 }, _count: { select: { quotes: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: { contacts: true, _count: { select: { quotes: true } } },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async create(dto) {
        if (dto.type === client_1.CustomerType.INDIVIDUAL && (!dto.firstName || !dto.lastName)) {
            throw new common_1.BadRequestException('First name and last name required for individual customers');
        }
        if (dto.type === client_1.CustomerType.COMPANY && !dto.companyName) {
            throw new common_1.BadRequestException('Company name required for company customers');
        }
        return this.prisma.customer.create({ data: dto });
    }
    async update(id, dto) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        if (dto.type === client_1.CustomerType.INDIVIDUAL && (!dto.firstName || !dto.lastName)) {
            throw new common_1.BadRequestException('First name and last name required for individual customers');
        }
        if (dto.type === client_1.CustomerType.COMPANY && !dto.companyName) {
            throw new common_1.BadRequestException('Company name required for company customers');
        }
        return this.prisma.customer.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: { _count: { select: { quotes: true } } },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        if (customer._count.quotes > 0) {
            throw new common_1.BadRequestException('Cannot delete customer with associated quotes');
        }
        return this.prisma.customer.delete({ where: { id } });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map