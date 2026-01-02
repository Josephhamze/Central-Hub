import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: CustomerType, page = 1, limit = 20, search?: string) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { companyName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
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

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { contacts: true, _count: { select: { quotes: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    if (dto.type === CustomerType.INDIVIDUAL && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('First name and last name required for individual customers');
    }
    if (dto.type === CustomerType.COMPANY && !dto.companyName) {
      throw new BadRequestException('Company name required for company customers');
    }
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (dto.type === CustomerType.INDIVIDUAL && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('First name and last name required for individual customers');
    }
    if (dto.type === CustomerType.COMPANY && !dto.companyName) {
      throw new BadRequestException('Company name required for company customers');
    }
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { quotes: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer._count.quotes > 0) {
      throw new BadRequestException('Cannot delete customer with associated quotes');
    }
    return this.prisma.customer.delete({ where: { id } });
  }
}
