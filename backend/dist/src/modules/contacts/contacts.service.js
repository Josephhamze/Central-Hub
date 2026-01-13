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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ContactsService = class ContactsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(customerId, page = 1, limit = 20) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = customerId ? { customerId } : {};
        const [items, total] = await Promise.all([
            this.prisma.contact.findMany({ where, skip, take: limitNum, include: { customer: { select: { id: true, type: true, companyName: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.contact.count({ where }),
        ]);
        return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const contact = await this.prisma.contact.findUnique({ where: { id }, include: { customer: true } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return contact;
    }
    async create(dto) {
        const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        if (dto.isPrimary) {
            await this.prisma.contact.updateMany({ where: { customerId: dto.customerId }, data: { isPrimary: false } });
        }
        return this.prisma.contact.create({ data: dto });
    }
    async update(id, dto) {
        const contact = await this.prisma.contact.findUnique({ where: { id } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        if (dto.isPrimary) {
            await this.prisma.contact.updateMany({ where: { customerId: contact.customerId, id: { not: id } }, data: { isPrimary: false } });
        }
        return this.prisma.contact.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const contact = await this.prisma.contact.findUnique({ where: { id } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return this.prisma.contact.delete({ where: { id } });
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map