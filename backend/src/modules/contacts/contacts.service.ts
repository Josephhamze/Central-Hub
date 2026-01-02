import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(customerId?: string, page = 1, limit = 20) {
    // Convert string query params to numbers
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

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id }, include: { customer: true } });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(dto: CreateContactDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (dto.isPrimary) {
      await this.prisma.contact.updateMany({ where: { customerId: dto.customerId }, data: { isPrimary: false } });
    }
    return this.prisma.contact.create({ data: dto });
  }

  async update(id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    if (dto.isPrimary) {
      await this.prisma.contact.updateMany({ where: { customerId: contact.customerId, id: { not: id } }, data: { isPrimary: false } });
    }
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.contact.delete({ where: { id } });
  }
}
