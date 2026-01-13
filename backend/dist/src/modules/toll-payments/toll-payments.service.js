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
exports.TollPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let TollPaymentsService = class TollPaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, filters) {
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (filters?.startDate || filters?.endDate) {
            where.paidAt = {};
            if (filters.startDate)
                where.paidAt.gte = filters.startDate;
            if (filters.endDate)
                where.paidAt.lte = filters.endDate;
        }
        if (filters?.routeId)
            where.routeId = filters.routeId;
        if (filters?.tollStationId)
            where.tollStationId = filters.tollStationId;
        if (filters?.vehicleType)
            where.vehicleType = filters.vehicleType;
        if (filters?.status)
            where.status = filters.status;
        if (filters?.paidByUserId)
            where.paidByUserId = filters.paidByUserId;
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
    async findOne(id) {
        const payment = await this.prisma.tollPayment.findUnique({
            where: { id },
            include: {
                route: true,
                tollStation: true,
                paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                attachments: true,
            },
        });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        return payment;
    }
    async create(dto, userId) {
        if (dto.routeId) {
            const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
            if (!route)
                throw new common_1.NotFoundException('Route not found');
        }
        if (dto.tollStationId) {
            const station = await this.prisma.tollStation.findUnique({ where: { id: dto.tollStationId } });
            if (!station)
                throw new common_1.NotFoundException('Toll station not found');
        }
        return this.prisma.tollPayment.create({
            data: {
                ...dto,
                paidAt: new Date(dto.paidAt),
                currency: dto.currency || 'USD',
                status: dto.status || client_1.TollPaymentStatus.DRAFT,
                paidByUserId: userId,
            },
            include: {
                route: { select: { id: true, fromCity: true, toCity: true } },
                tollStation: { select: { id: true, name: true } },
                paidBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
    async update(id, dto, userId, userPermissions) {
        const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        if (payment.status === client_1.TollPaymentStatus.POSTED && !userPermissions.includes('logistics:toll_payments:post')) {
            throw new common_1.ForbiddenException('Cannot update posted payment');
        }
        const updateData = { ...dto };
        if (dto.paidAt)
            updateData.paidAt = new Date(dto.paidAt);
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
    async submit(id) {
        const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        if (payment.status !== client_1.TollPaymentStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft payments can be submitted');
        }
        return this.prisma.tollPayment.update({
            where: { id },
            data: { status: client_1.TollPaymentStatus.SUBMITTED },
        });
    }
    async approve(id) {
        const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        if (payment.status !== client_1.TollPaymentStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted payments can be approved');
        }
        return this.prisma.tollPayment.update({
            where: { id },
            data: { status: client_1.TollPaymentStatus.APPROVED },
        });
    }
    async post(id) {
        const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        if (payment.status !== client_1.TollPaymentStatus.APPROVED && payment.status !== client_1.TollPaymentStatus.DRAFT) {
            throw new common_1.BadRequestException('Only approved or draft payments can be posted');
        }
        return this.prisma.tollPayment.update({
            where: { id },
            data: { status: client_1.TollPaymentStatus.POSTED },
        });
    }
    async remove(id, userId, userPermissions) {
        const payment = await this.prisma.tollPayment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Toll payment not found');
        if (payment.status === client_1.TollPaymentStatus.POSTED && !userPermissions.includes('logistics:toll_payments:post')) {
            throw new common_1.ForbiddenException('Cannot delete posted payment');
        }
        return this.prisma.tollPayment.delete({ where: { id } });
    }
    async reconcile(dto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const actualPayments = await this.prisma.tollPayment.findMany({
            where: {
                paidAt: { gte: startDate, lte: endDate },
                status: client_1.TollPaymentStatus.POSTED,
                ...(dto.routeId && { routeId: dto.routeId }),
                ...(dto.vehicleType && { vehicleType: dto.vehicleType }),
            },
            include: {
                route: true,
                tollStation: true,
            },
        });
        let actualTollsTotal = new library_1.Decimal(0);
        const byStation = {};
        for (const payment of actualPayments) {
            const amount = new library_1.Decimal(payment.amount);
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
                const current = new library_1.Decimal(byStation[stationId].actual);
                byStation[stationId].actual = current.add(amount).toString();
            }
        }
        let expectedTollsTotal = new library_1.Decimal(0);
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
                    const amount = new library_1.Decimal(activeRate.amount);
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
                    const current = new library_1.Decimal(byStation[stationId].expected);
                    byStation[stationId].expected = current.add(amount).toString();
                }
            }
        }
        for (const stationId in byStation) {
            const expected = new library_1.Decimal(byStation[stationId].expected);
            const actual = new library_1.Decimal(byStation[stationId].actual);
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
};
exports.TollPaymentsService = TollPaymentsService;
exports.TollPaymentsService = TollPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TollPaymentsService);
//# sourceMappingURL=toll-payments.service.js.map