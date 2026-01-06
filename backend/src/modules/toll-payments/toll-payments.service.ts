import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTollPaymentDto } from './dto/create-toll-payment.dto';
import { UpdateTollPaymentDto } from './dto/update-toll-payment.dto';
import { ReconcileTollPaymentsDto } from './dto/reconcile-toll-payments.dto';
import { TollPaymentStatus, VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TollPaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      routeId?: string;
      tollStationId?: string;
      vehicleType?: VehicleType;
      status?: TollPaymentStatus;
      paidByUserId?: string;
    },
  ) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.paidAt = {};
      if (filters.startDate) where.paidAt.gte = filters.startDate;
      if (filters.endDate) where.paidAt.lte = filters.endDate;
    }
    if (filters?.routeId) where.routeId = filters.routeId;
    if (filters?.tollStationId) where.tollStationId = filters.tollStationId;
    if (filters?.vehicleType) where.vehicleType = filters.vehicleType;
    if (filters?.status) where.status = filters.status;
    if (filters?.paidByUserId) where.paidByUserId = filters.paidByUserId;

    const [items, total] = await Promise.all([
      this.prisma.tollPayment.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          route: { select: { id: true, fromCity: true, toCity: true } },
          tollStation: { select: { id: true, name: true } },
          paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          attachments: true,
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.tollPayment.count({ where }),
    ]);

    return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
  }

  async findOne(id: string) {
    const payment = await this.prisma.tollPayment.findUnique({
      where: { id },
      include: {
        route: true,
        tollStation: true,
        paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        attachments: true,
      },
    });
    if (!payment) throw new NotFoundException('Toll payment not found');
    return payment;
  }

  async create(dto: CreateTollPaymentDto, userId?: string) {
    // Validate route and station if provided
    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
      if (!route) throw new NotFoundException('Route not found');
    }
    if (dto.tollStationId) {
      const station = await this.prisma.tollStation.findUnique({ where: { id: dto.tollStationId } });
      if (!station) throw new NotFoundException('Toll station not found');
    }

    return this.prisma.tollPayment.create({
      data: {
        ...dto,
        paidAt: new Date(dto.paidAt),
        currency: dto.currency || 'USD',
        status: dto.status || TollPaymentStatus.DRAFT,
        paidByUserId: userId,
      },
      include: {
        route: { select: { id: true, fromCity: true, toCity: true } },
        tollStation: { select: { id: true, name: true } },
        paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateTollPaymentDto, userId: string, userPermissions: string[]) {
    const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Toll payment not found');

    // Only allow updates if not posted, or user has approval permissions
    if (payment.status === TollPaymentStatus.POSTED && !userPermissions.includes('logistics:toll_payments:post')) {
      throw new ForbiddenException('Cannot update posted payment');
    }

    const updateData: any = { ...dto };
    if (dto.paidAt) updateData.paidAt = new Date(dto.paidAt);

    return this.prisma.tollPayment.update({
      where: { id },
      data: updateData,
      include: {
        route: { select: { id: true, fromCity: true, toCity: true } },
        tollStation: { select: { id: true, name: true } },
        paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async submit(id: string) {
    const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Toll payment not found');
    if (payment.status !== TollPaymentStatus.DRAFT) {
      throw new BadRequestException('Only draft payments can be submitted');
    }
    return this.prisma.tollPayment.update({
      where: { id },
      data: { status: TollPaymentStatus.SUBMITTED },
    });
  }

  async approve(id: string) {
    const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Toll payment not found');
    if (payment.status !== TollPaymentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payments can be approved');
    }
    return this.prisma.tollPayment.update({
      where: { id },
      data: { status: TollPaymentStatus.APPROVED },
    });
  }

  async post(id: string) {
    const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Toll payment not found');
    if (payment.status !== TollPaymentStatus.APPROVED && payment.status !== TollPaymentStatus.DRAFT) {
      throw new BadRequestException('Only approved or draft payments can be posted');
    }
    return this.prisma.tollPayment.update({
      where: { id },
      data: { status: TollPaymentStatus.POSTED },
    });
  }

  async remove(id: string, userId: string, userPermissions: string[]) {
    const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Toll payment not found');

    // Only allow deletion if not posted, or user has post permissions
    if (payment.status === TollPaymentStatus.POSTED && !userPermissions.includes('logistics:toll_payments:post')) {
      throw new ForbiddenException('Cannot delete posted payment');
    }

    return this.prisma.tollPayment.delete({ where: { id } });
  }

  // Reconciliation: Compare expected vs actual toll payments
  async reconcile(dto: ReconcileTollPaymentsDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Get actual payments
    const actualPayments = await this.prisma.tollPayment.findMany({
      where: {
        paidAt: { gte: startDate, lte: endDate },
        status: TollPaymentStatus.POSTED,
        ...(dto.routeId && { routeId: dto.routeId }),
        ...(dto.vehicleType && { vehicleType: dto.vehicleType }),
      },
      include: {
        route: true,
        tollStation: true,
      },
    });

    // Calculate actual totals
    let actualTollsTotal = new Decimal(0);
    const byStation: Record<string, { stationId: string; stationName: string; expected: string; actual: string; variance: string }> = {};

    for (const payment of actualPayments) {
      const amount = new Decimal(payment.amount);
      actualTollsTotal = actualTollsTotal.add(amount);

      if (payment.tollStationId) {
        const stationId = payment.tollStationId;
        if (!byStation[stationId]) {
          byStation[stationId] = {
            stationId,
            stationName: payment.tollStation?.name || 'Unknown',
            expected: '0',
            actual: '0',
            variance: '0',
          };
        }
        const current = new Decimal(byStation[stationId].actual);
        byStation[stationId].actual = current.add(amount).toString();
      }
    }

    // Calculate expected totals from routes
    let expectedTollsTotal = new Decimal(0);
    const routes = await this.prisma.route.findMany({
      where: {
        ...(dto.routeId && { id: dto.routeId }),
        isActive: true,
        tollStations: {
          some: { isActive: true },
        },
      },
      include: {
        tollStations: {
          where: { isActive: true },
          include: {
            tollStation: {
              include: {
                rates: {
                  where: {
                    isActive: true,
                    ...(dto.vehicleType && { vehicleType: dto.vehicleType }),
                    OR: [
                      { effectiveFrom: null },
                      { effectiveFrom: { lte: endDate } },
                    ],
                    AND: [
                      {
                        OR: [
                          { effectiveTo: null },
                          { effectiveTo: { gte: startDate } },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const route of routes) {
      for (const routeStation of route.tollStations) {
        const activeRate = routeStation.tollStation.rates.find((r) => r.isActive);
        if (activeRate) {
          const amount = new Decimal(activeRate.amount);
          expectedTollsTotal = expectedTollsTotal.add(amount);

          const stationId = routeStation.tollStation.id;
          if (!byStation[stationId]) {
            byStation[stationId] = {
              stationId,
              stationName: routeStation.tollStation.name,
              expected: '0',
              actual: '0',
              variance: '0',
            };
          }
          const current = new Decimal(byStation[stationId].expected);
          byStation[stationId].expected = current.add(amount).toString();
        }
      }
    }

    // Calculate variances
    for (const stationId in byStation) {
      const expected = new Decimal(byStation[stationId].expected);
      const actual = new Decimal(byStation[stationId].actual);
      byStation[stationId].variance = actual.sub(expected).toString();
    }

    const variance = actualTollsTotal.sub(expectedTollsTotal);

    return {
      dateRange: { startDate: dto.startDate, endDate: dto.endDate },
      routeId: dto.routeId,
      vehicleType: dto.vehicleType,
      expectedTollsTotal: expectedTollsTotal.toString(),
      actualTollsTotal: actualTollsTotal.toString(),
      variance: variance.toString(),
      byStation: Object.values(byStation),
    };
  }
}
