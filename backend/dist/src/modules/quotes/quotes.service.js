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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const quote_archiving_service_1 = require("./quote-archiving.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let QuotesService = class QuotesService {
    prisma;
    notificationsService;
    quoteArchivingService;
    constructor(prisma, notificationsService, quoteArchivingService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.quoteArchivingService = quoteArchivingService;
    }
    calculateExpiresAt(approvedAt, createdAt, validityDays) {
        if (approvedAt) {
            const expiresAt = new Date(approvedAt);
            expiresAt.setDate(expiresAt.getDate() + validityDays);
            return expiresAt;
        }
        const expiresAt = new Date(createdAt);
        expiresAt.setDate(expiresAt.getDate() + validityDays);
        return expiresAt;
    }
    async generateQuoteNumber() {
        const now = new Date();
        const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
        return this.prisma.$transaction(async (tx) => {
            const lastQuote = await tx.quote.findFirst({
                where: { quoteNumber: { startsWith: `Q-${yearMonth}-` } },
                orderBy: { quoteNumber: 'desc' },
            });
            let sequence = 1;
            if (lastQuote) {
                const lastSeq = parseInt(lastQuote.quoteNumber.split('-')[2] || '0', 10);
                sequence = lastSeq + 1;
            }
            const quoteNumber = `Q-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
            const exists = await tx.quote.findUnique({ where: { quoteNumber } });
            if (exists) {
                throw new Error('Quote number collision');
            }
            return quoteNumber;
        });
    }
    calculateServiceEndDate(deliveryStartDate, loadsPerDay, truckType, totalTonnage) {
        if (!deliveryStartDate || !loadsPerDay || !truckType) {
            return null;
        }
        const truckCapacity = truckType === 'TIPPER_42T' ? 42 : 40;
        const numberOfLoads = Math.ceil(totalTonnage.toNumber() / truckCapacity);
        const numberOfDays = Math.ceil(numberOfLoads / loadsPerDay);
        const endDate = new Date(deliveryStartDate);
        endDate.setDate(endDate.getDate() + numberOfDays);
        return endDate;
    }
    async calculateTransport(routeId, items = []) {
        if (!routeId) {
            return { base: new library_1.Decimal(0), tolls: new library_1.Decimal(0), total: new library_1.Decimal(0), distanceKm: new library_1.Decimal(0), costPerKm: new library_1.Decimal(0), totalTonnage: new library_1.Decimal(0) };
        }
        const route = await this.prisma.route.findUnique({
            where: { id: routeId },
            include: { tolls: true },
        });
        if (!route) {
            throw new common_1.NotFoundException('Route not found');
        }
        const distanceKm = new library_1.Decimal(route.distanceKm);
        if (!route.costPerKm || route.costPerKm.eq(0)) {
            throw new common_1.BadRequestException('Route rate per km (costPerKm) is required for transport calculation. Please set the rate per km on the route.');
        }
        const costPerKm = new library_1.Decimal(route.costPerKm);
        let totalTonnage = new library_1.Decimal(0);
        for (const item of items) {
            const qty = new library_1.Decimal(item.qty);
            const uom = item.uomSnapshot.toUpperCase();
            if (uom === 'TON' || uom === 'TONS' || uom === 'T') {
                totalTonnage = totalTonnage.add(qty);
            }
            else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
                totalTonnage = totalTonnage.add(qty.div(1000));
            }
            else if (uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
                totalTonnage = totalTonnage.add(qty);
            }
            else {
                totalTonnage = totalTonnage.add(qty);
            }
        }
        if (totalTonnage.eq(0)) {
            totalTonnage = new library_1.Decimal(1);
        }
        const transportBase = totalTonnage.mul(costPerKm).mul(distanceKm);
        const tollTotal = route.tolls.reduce((sum, toll) => sum.add(new library_1.Decimal(toll.cost)), new library_1.Decimal(0));
        const transportTotal = transportBase.add(tollTotal);
        return {
            base: transportBase,
            tolls: tollTotal,
            total: transportTotal,
            distanceKm,
            costPerKm,
            totalTonnage,
        };
    }
    async validateQuoteItem(stockItemId, qty, unitPrice, discountPercentage) {
        const stockItem = await this.prisma.stockItem.findUnique({
            where: { id: stockItemId },
        });
        if (!stockItem) {
            throw new common_1.NotFoundException(`Stock item ${stockItemId} not found`);
        }
        if (!stockItem.isActive) {
            throw new common_1.BadRequestException(`Stock item ${stockItem.name} is not active`);
        }
        const qtyDecimal = new library_1.Decimal(qty);
        const unitPriceDecimal = new library_1.Decimal(unitPrice);
        const discountPercentageDecimal = new library_1.Decimal(discountPercentage || 0);
        const discountAmount = unitPriceDecimal.mul(discountPercentageDecimal).div(100);
        const finalPrice = unitPriceDecimal.sub(discountAmount);
        if (finalPrice.lt(stockItem.minUnitPrice)) {
            throw new common_1.BadRequestException(`Unit price (${finalPrice}) cannot be below minimum (${stockItem.minUnitPrice}) for ${stockItem.name}`);
        }
        if (qtyDecimal.lt(stockItem.minOrderQty)) {
            throw new common_1.BadRequestException(`Quantity (${qty}) must be at least ${stockItem.minOrderQty} for ${stockItem.name}`);
        }
        if (stockItem.truckloadOnly) {
            const remainder = qtyDecimal.mod(stockItem.minOrderQty);
            if (!remainder.eq(0)) {
                throw new common_1.BadRequestException(`Quantity for ${stockItem.name} must be a multiple of ${stockItem.minOrderQty} (truckload only)`);
            }
        }
        return {
            name: stockItem.name,
            uom: stockItem.uom,
            minUnitPrice: stockItem.minUnitPrice,
            minOrderQty: stockItem.minOrderQty,
            truckloadOnly: stockItem.truckloadOnly,
        };
    }
    async findAll(userId, userPermissions, filters = {}, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        const canViewAll = userPermissions.includes('quotes:view') &&
            (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
        if (!canViewAll) {
            where.salesRepUserId = userId;
        }
        if (filters.status)
            where.status = filters.status;
        if (filters.companyId)
            where.companyId = filters.companyId;
        if (filters.projectId)
            where.projectId = filters.projectId;
        if (filters.salesRepUserId)
            where.salesRepUserId = filters.salesRepUserId;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        if (!filters.includeArchived) {
            where.archived = false;
        }
        const [items, total] = await Promise.all([
            this.prisma.quote.findMany({
                where,
                skip,
                take: limit,
                include: {
                    company: { select: { id: true, name: true } },
                    project: { select: { id: true, name: true } },
                    customer: { select: { id: true, type: true, companyName: true, firstName: true, lastName: true } },
                    contact: { select: { id: true, name: true } },
                    salesRep: { select: { id: true, firstName: true, lastName: true, email: true } },
                    items: { include: { stockItem: { select: { id: true, name: true } } } },
                    _count: { select: { approvals: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.quote.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, userId, userPermissions) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: {
                company: true,
                project: true,
                customer: true,
                contact: true,
                route: { include: { tolls: true } },
                salesRep: { select: { id: true, firstName: true, lastName: true, email: true } },
                items: { include: { stockItem: { select: { id: true, name: true, sku: true } } } },
                approvals: { include: { actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!quote) {
            throw new common_1.NotFoundException('Quote not found');
        }
        const canViewAll = userPermissions.includes('quotes:view') &&
            (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
        if (!canViewAll && quote.salesRepUserId !== userId) {
            throw new common_1.ForbiddenException('You can only view your own quotes');
        }
        return quote;
    }
    async create(dto, userId) {
        const [company, project, customer] = await Promise.all([
            this.prisma.company.findUnique({ where: { id: dto.companyId } }),
            this.prisma.project.findUnique({ where: { id: dto.projectId } }),
            this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
        ]);
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        if (project.companyId !== company.id) {
            throw new common_1.BadRequestException('Project does not belong to the selected company');
        }
        if (dto.contactId) {
            const contact = await this.prisma.contact.findUnique({ where: { id: dto.contactId } });
            if (!contact)
                throw new common_1.NotFoundException('Contact not found');
            if (contact.customerId !== customer.id) {
                throw new common_1.BadRequestException('Contact does not belong to the selected customer');
            }
        }
        let routeId = dto.routeId;
        let departureCity = null;
        if (dto.deliveryMethod === client_1.DeliveryMethod.DELIVERED && !routeId) {
            if (!dto.deliveryAddressLine1) {
                throw new common_1.BadRequestException('Delivery address is required for route calculation');
            }
            let deliveryCity = null;
            if (dto.deliveryCity) {
                deliveryCity = dto.deliveryCity;
            }
            else if (dto.deliveryAddressLine1) {
                const addressParts = dto.deliveryAddressLine1.split(',').map(p => p.trim());
                if (addressParts.length >= 2) {
                    deliveryCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1];
                }
                else {
                    deliveryCity = addressParts[0];
                }
            }
            if (!deliveryCity) {
                throw new common_1.BadRequestException('Could not determine delivery city from address. Please ensure the address includes the city name.');
            }
            if (dto.warehouseId) {
                const warehouse = await this.prisma.warehouse.findUnique({
                    where: { id: dto.warehouseId },
                });
                if (warehouse?.locationCity) {
                    departureCity = warehouse.locationCity;
                }
            }
            if (!departureCity && company.city) {
                departureCity = company.city;
            }
            if (!departureCity) {
                routeId = undefined;
            }
            else {
                const matchedRoute = await this.prisma.route.findFirst({
                    where: {
                        fromCity: departureCity,
                        toCity: deliveryCity,
                    },
                });
                if (matchedRoute) {
                    routeId = matchedRoute.id;
                }
            }
        }
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Quote must have at least one item');
        }
        const projectStockItems = await this.prisma.stockItem.findMany({
            where: { projectId: dto.projectId, isActive: true },
        });
        const stockItemMap = new Map(projectStockItems.map(item => [item.id, item]));
        let subtotal = new library_1.Decimal(0);
        let discountTotal = new library_1.Decimal(0);
        const quoteItems = [];
        for (const itemDto of dto.items) {
            const stockItem = stockItemMap.get(itemDto.stockItemId);
            if (!stockItem) {
                throw new common_1.NotFoundException(`Stock item ${itemDto.stockItemId} not found or not available for this project`);
            }
            const validation = await this.validateQuoteItem(itemDto.stockItemId, itemDto.qty, itemDto.unitPrice, itemDto.discountPercentage || 0);
            const qtyDecimal = new library_1.Decimal(itemDto.qty);
            const unitPriceDecimal = new library_1.Decimal(itemDto.unitPrice);
            const discountPercentageDecimal = new library_1.Decimal(itemDto.discountPercentage || 0);
            const discountAmount = unitPriceDecimal.mul(discountPercentageDecimal).div(100);
            const lineTotal = qtyDecimal.mul(unitPriceDecimal.sub(discountAmount));
            subtotal = subtotal.add(qtyDecimal.mul(unitPriceDecimal));
            discountTotal = discountTotal.add(qtyDecimal.mul(discountAmount));
            quoteItems.push({
                stockItemId: itemDto.stockItemId,
                nameSnapshot: validation.name,
                uomSnapshot: validation.uom,
                qty: qtyDecimal,
                unitPrice: unitPriceDecimal,
                discountPercentage: discountPercentageDecimal,
                lineTotal,
            });
        }
        const transport = await this.calculateTransport(routeId, quoteItems.map(item => ({ qty: item.qty, uomSnapshot: item.uomSnapshot })));
        const grandTotal = subtotal.sub(discountTotal).add(transport.total);
        const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : null;
        const serviceEndDate = this.calculateServiceEndDate(deliveryStartDate, dto.loadsPerDay || null, dto.truckType || null, transport.totalTonnage);
        const validityDays = dto.validityDays || 7;
        const quoteNumber = await this.generateQuoteNumber();
        const createdAt = new Date();
        const expiresAt = this.calculateExpiresAt(null, createdAt, validityDays);
        const quote = await this.prisma.quote.create({
            data: {
                quoteNumber,
                companyId: dto.companyId,
                expiresAt,
                projectId: dto.projectId,
                customerId: dto.customerId,
                contactId: dto.contactId,
                deliveryMethod: dto.deliveryMethod,
                deliveryAddressLine1: dto.deliveryAddressLine1,
                deliveryAddressLine2: dto.deliveryAddressLine2,
                deliveryCity: dto.deliveryCity || null,
                deliveryState: dto.deliveryState,
                deliveryPostalCode: dto.deliveryPostalCode,
                deliveryCountry: dto.deliveryCountry,
                routeId: routeId,
                distanceKmSnapshot: transport.distanceKm,
                costPerKmSnapshot: transport.costPerKm,
                tollTotalSnapshot: transport.tolls,
                subtotal,
                discountPercentage: subtotal.gt(0) ? discountTotal.div(subtotal).mul(100) : new library_1.Decimal(0),
                transportTotal: transport.total,
                grandTotal,
                validityDays,
                paymentTerms: dto.paymentTerms,
                deliveryStartDate: deliveryStartDate,
                serviceEndDate: serviceEndDate,
                loadsPerDay: dto.loadsPerDay,
                truckType: dto.truckType,
                status: client_1.QuoteStatus.DRAFT,
                salesRepUserId: userId,
                items: {
                    create: quoteItems,
                },
            },
            include: {
                company: true,
                project: true,
                customer: true,
                contact: true,
                route: { include: { tolls: true } },
                items: { include: { stockItem: true } },
            },
        });
        if (!routeId && !dto.routeId && dto.warehouseId) {
            const pendingRouteRequest = await this.prisma.routeRequest.findFirst({
                where: {
                    requestedByUserId: userId,
                    warehouseId: dto.warehouseId,
                    status: 'PENDING',
                    quoteId: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            if (pendingRouteRequest) {
                await this.prisma.routeRequest.update({
                    where: { id: pendingRouteRequest.id },
                    data: { quoteId: quote.id },
                });
            }
        }
        return quote;
    }
    async update(id, dto, userId, userPermissions) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.salesRepUserId !== userId && !userPermissions.includes('quotes:approve')) {
            throw new common_1.ForbiddenException('You can only edit your own quotes');
        }
        if (quote.status !== client_1.QuoteStatus.DRAFT && quote.status !== client_1.QuoteStatus.REJECTED) {
            throw new common_1.BadRequestException(`Cannot edit quote with status ${quote.status}`);
        }
        if (dto.items && dto.items.length > 0) {
            const project = await this.prisma.project.findUnique({ where: { id: quote.projectId } });
            if (!project)
                throw new common_1.NotFoundException('Project not found');
            const projectStockItems = await this.prisma.stockItem.findMany({
                where: { projectId: project.id, isActive: true },
            });
            const stockItemMap = new Map(projectStockItems.map(item => [item.id, item]));
            let subtotal = new library_1.Decimal(0);
            let discountTotal = new library_1.Decimal(0);
            const quoteItems = [];
            for (const itemDto of dto.items) {
                const stockItem = stockItemMap.get(itemDto.stockItemId);
                if (!stockItem) {
                    throw new common_1.NotFoundException(`Stock item ${itemDto.stockItemId} not found`);
                }
                const validation = await this.validateQuoteItem(itemDto.stockItemId, itemDto.qty, itemDto.unitPrice, itemDto.discountPercentage || 0);
                const qtyDecimal = new library_1.Decimal(itemDto.qty);
                const unitPriceDecimal = new library_1.Decimal(itemDto.unitPrice);
                const discountPercentageDecimal = new library_1.Decimal(itemDto.discountPercentage || 0);
                const discountAmount = unitPriceDecimal.mul(discountPercentageDecimal).div(100);
                const lineTotal = qtyDecimal.mul(unitPriceDecimal.sub(discountAmount));
                subtotal = subtotal.add(qtyDecimal.mul(unitPriceDecimal));
                discountTotal = discountTotal.add(qtyDecimal.mul(discountAmount));
                quoteItems.push({
                    stockItemId: itemDto.stockItemId,
                    nameSnapshot: validation.name,
                    uomSnapshot: validation.uom,
                    qty: qtyDecimal,
                    unitPrice: unitPriceDecimal,
                    discountPercentage: discountPercentageDecimal,
                    lineTotal,
                });
            }
            let routeId = dto.routeId ?? quote.routeId;
            let departureCity = null;
            if (dto.deliveryMethod === client_1.DeliveryMethod.DELIVERED || (!dto.deliveryMethod && quote.deliveryMethod === client_1.DeliveryMethod.DELIVERED)) {
                let deliveryCity = dto.deliveryCity ?? quote.deliveryCity;
                if (!deliveryCity && (dto.deliveryAddressLine1 || quote.deliveryAddressLine1)) {
                    const address = dto.deliveryAddressLine1 || quote.deliveryAddressLine1 || '';
                    const addressParts = address.split(',').map(p => p.trim());
                    if (addressParts.length >= 2) {
                        deliveryCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1];
                    }
                    else {
                        deliveryCity = addressParts[0];
                    }
                }
                if (deliveryCity && !routeId) {
                    const warehouseId = dto.warehouseId ?? quote.warehouseId;
                    if (warehouseId) {
                        const warehouse = await this.prisma.warehouse.findUnique({
                            where: { id: warehouseId },
                        });
                        if (warehouse?.locationCity) {
                            departureCity = warehouse.locationCity;
                        }
                    }
                    if (!departureCity) {
                        const project = await this.prisma.project.findUnique({
                            where: { id: quote.projectId },
                            include: { company: true },
                        });
                        if (project?.company?.city) {
                            departureCity = project.company.city;
                        }
                    }
                    if (departureCity) {
                        const matchedRoute = await this.prisma.route.findFirst({
                            where: {
                                fromCity: departureCity,
                                toCity: deliveryCity,
                            },
                        });
                        if (matchedRoute) {
                            routeId = matchedRoute.id;
                        }
                    }
                }
            }
            const transport = await this.calculateTransport(routeId, quoteItems.map(item => ({ qty: item.qty, uomSnapshot: item.uomSnapshot })));
            const grandTotal = subtotal.sub(discountTotal).add(transport.total);
            const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : (quote.deliveryStartDate || null);
            const loadsPerDay = dto.loadsPerDay !== undefined ? dto.loadsPerDay : quote.loadsPerDay;
            const truckType = dto.truckType !== undefined ? dto.truckType : quote.truckType;
            const serviceEndDate = this.calculateServiceEndDate(deliveryStartDate, loadsPerDay, truckType, transport.totalTonnage);
            return this.prisma.$transaction([
                this.prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
                this.prisma.quote.update({
                    where: { id },
                    data: {
                        ...dto,
                        subtotal,
                        discountPercentage: subtotal.gt(0) ? discountTotal.div(subtotal).mul(100) : new library_1.Decimal(0),
                        transportTotal: transport.total,
                        grandTotal,
                        validityDays: dto.validityDays !== undefined ? dto.validityDays : undefined,
                        paymentTerms: dto.paymentTerms !== undefined ? dto.paymentTerms : undefined,
                        serviceEndDate: serviceEndDate,
                        deliveryStartDate: dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : undefined,
                        loadsPerDay: dto.loadsPerDay !== undefined ? dto.loadsPerDay : undefined,
                        truckType: dto.truckType !== undefined ? dto.truckType : undefined,
                        distanceKmSnapshot: transport.distanceKm,
                        costPerKmSnapshot: transport.costPerKm,
                        tollTotalSnapshot: transport.tolls,
                        items: {
                            create: quoteItems,
                        },
                    },
                    include: {
                        company: true,
                        project: true,
                        customer: true,
                        items: { include: { stockItem: true } },
                    },
                }),
            ]).then(([, updated]) => updated);
        }
        else {
            const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : (quote.deliveryStartDate || null);
            const loadsPerDay = dto.loadsPerDay !== undefined ? dto.loadsPerDay : quote.loadsPerDay;
            const truckType = dto.truckType !== undefined ? dto.truckType : quote.truckType;
            const existingItems = await this.prisma.quoteItem.findMany({
                where: { quoteId: id },
            });
            let totalTonnage = new library_1.Decimal(0);
            for (const item of existingItems) {
                const qty = new library_1.Decimal(item.qty);
                const uom = item.uomSnapshot.toUpperCase();
                if (uom === 'TON' || uom === 'TONS' || uom === 'T') {
                    totalTonnage = totalTonnage.add(qty);
                }
                else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
                    totalTonnage = totalTonnage.add(qty.div(1000));
                }
                else if (uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
                    totalTonnage = totalTonnage.add(qty);
                }
                else {
                    totalTonnage = totalTonnage.add(qty);
                }
            }
            const serviceEndDate = this.calculateServiceEndDate(deliveryStartDate, loadsPerDay, truckType, totalTonnage);
            return this.prisma.quote.update({
                where: { id },
                data: {
                    ...dto,
                    serviceEndDate: serviceEndDate !== undefined ? serviceEndDate : undefined,
                    deliveryStartDate: dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : undefined,
                },
                include: {
                    company: true,
                    project: true,
                    customer: true,
                    items: { include: { stockItem: true } },
                },
            });
        }
    }
    async submit(id, userId, notes) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.salesRepUserId !== userId) {
            throw new common_1.ForbiddenException('You can only submit your own quotes');
        }
        if (quote.status !== client_1.QuoteStatus.DRAFT && quote.status !== client_1.QuoteStatus.REJECTED) {
            throw new common_1.BadRequestException(`Cannot submit quote with status ${quote.status}`);
        }
        if (quote.items.length === 0) {
            throw new common_1.BadRequestException('Cannot submit quote without items');
        }
        if (quote.deliveryMethod === client_1.DeliveryMethod.DELIVERED && !quote.routeId) {
            throw new common_1.BadRequestException('A route is required for delivered quotes. Please request a route or select an existing one before submitting.');
        }
        return this.prisma.$transaction([
            this.prisma.quote.update({
                where: { id },
                data: {
                    status: client_1.QuoteStatus.PENDING_APPROVAL,
                    submittedAt: new Date(),
                },
            }),
            this.prisma.quoteApprovalAudit.create({
                data: {
                    quoteId: id,
                    action: client_1.ApprovalAction.SUBMIT,
                    actorUserId: userId,
                    notes,
                },
            }),
        ]).then(() => this.findOne(id, userId, ['quotes:view']));
    }
    async approve(id, userId, userPermissions, notes) {
        if (!userPermissions.includes('quotes:approve')) {
            throw new common_1.ForbiddenException('You do not have permission to approve quotes');
        }
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.status !== client_1.QuoteStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException(`Cannot approve quote with status ${quote.status}`);
        }
        const approvedAt = new Date();
        const expiresAt = this.calculateExpiresAt(approvedAt, quote.createdAt, quote.validityDays);
        const result = await this.prisma.$transaction([
            this.prisma.quote.update({
                where: { id },
                data: {
                    status: client_1.QuoteStatus.APPROVED,
                    approvedAt,
                    expiresAt,
                },
            }),
            this.prisma.quoteApprovalAudit.create({
                data: {
                    quoteId: id,
                    action: client_1.ApprovalAction.APPROVE,
                    actorUserId: userId,
                    notes,
                },
            }),
        ]);
        if (quote.salesRepUserId) {
            try {
                await this.notificationsService.create(quote.salesRepUserId, 'quote_approved', 'Quote Approved', `Your quote ${quote.quoteNumber} has been approved.`, `/sales/quotes/${id}`);
            }
            catch (error) {
                console.error('Failed to create approval notification:', error);
            }
        }
        return this.findOne(id, userId, userPermissions);
    }
    async reject(id, userId, userPermissions, reason) {
        if (!userPermissions.includes('quotes:reject')) {
            throw new common_1.ForbiddenException('You do not have permission to reject quotes');
        }
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.status !== client_1.QuoteStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException(`Cannot reject quote with status ${quote.status}`);
        }
        const result = await this.prisma.$transaction([
            this.prisma.quote.update({
                where: { id },
                data: {
                    status: client_1.QuoteStatus.REJECTED,
                    rejectedAt: new Date(),
                },
            }),
            this.prisma.quoteApprovalAudit.create({
                data: {
                    quoteId: id,
                    action: client_1.ApprovalAction.REJECT,
                    actorUserId: userId,
                    notes: reason,
                },
            }),
        ]);
        if (quote.salesRepUserId) {
            await this.notificationsService.create(quote.salesRepUserId, 'quote_rejected', 'Quote Rejected', `Your quote ${quote.quoteNumber} has been rejected. Reason: ${reason}`, `/sales/quotes/${id}`);
        }
        return this.findOne(id, userId, userPermissions);
    }
    async withdraw(id, userId) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.salesRepUserId !== userId) {
            throw new common_1.ForbiddenException('You can only withdraw your own quotes');
        }
        if (quote.status !== client_1.QuoteStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException(`Cannot withdraw quote with status ${quote.status}. Only quotes pending approval can be withdrawn.`);
        }
        return this.prisma.$transaction([
            this.prisma.quote.update({
                where: { id },
                data: {
                    status: client_1.QuoteStatus.DRAFT,
                    submittedAt: null,
                },
            }),
            this.prisma.quoteApprovalAudit.create({
                data: {
                    quoteId: id,
                    action: client_1.ApprovalAction.WITHDRAW,
                    actorUserId: userId,
                },
            }),
        ]).then(() => this.findOne(id, userId, ['quotes:view']));
    }
    async markOutcome(id, outcome, userId, userPermissions, lossReasonCategory, reasonNotes) {
        if (!userPermissions.includes('quotes:approve')) {
            throw new common_1.ForbiddenException('You do not have permission to mark quote outcomes');
        }
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (quote.status !== client_1.QuoteStatus.APPROVED) {
            throw new common_1.BadRequestException('Can only mark outcome for approved quotes');
        }
        const status = outcome === 'WON' ? client_1.QuoteStatus.WON : client_1.QuoteStatus.LOST;
        const action = outcome === 'WON' ? client_1.ApprovalAction.MARK_WON : client_1.ApprovalAction.MARK_LOST;
        const now = new Date();
        return this.prisma.$transaction([
            this.prisma.quote.update({
                where: { id },
                data: {
                    status,
                    lossReasonCategory: outcome === 'LOST' ? (lossReasonCategory || null) : null,
                    outcomeReasonNotes: reasonNotes,
                },
            }),
            this.prisma.quoteApprovalAudit.create({
                data: {
                    quoteId: id,
                    action,
                    actorUserId: userId,
                    notes: reasonNotes,
                },
            }),
        ]).then(() => this.findOne(id, userId, userPermissions));
    }
    async remove(id, userId, userPermissions) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        const isAdmin = userPermissions.includes('quotes:approve');
        const isCreator = quote.salesRepUserId === userId;
        if (isAdmin) {
            return this.prisma.quote.delete({ where: { id } });
        }
        if (!isCreator) {
            throw new common_1.ForbiddenException('You can only delete your own quotes');
        }
        if (quote.status !== client_1.QuoteStatus.DRAFT) {
            throw new common_1.BadRequestException('You can only delete draft quotes');
        }
        return this.prisma.quote.delete({ where: { id } });
    }
    async archive(id, userId, userPermissions) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (!userPermissions.includes('quotes:approve') && quote.salesRepUserId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to archive this quote');
        }
        const archivableStatuses = [client_1.QuoteStatus.WON, client_1.QuoteStatus.LOST, client_1.QuoteStatus.REJECTED];
        if (!archivableStatuses.includes(quote.status)) {
            throw new common_1.BadRequestException('Can only archive quotes that are WON, LOST, or REJECTED');
        }
        if (quote.archived) {
            throw new common_1.BadRequestException('Quote is already archived');
        }
        await this.quoteArchivingService.archiveQuote(id);
        return this.findOne(id, userId, userPermissions);
    }
    async getSalesKPIs(userId, userPermissions, filters = {}) {
        const where = {};
        const canViewAll = userPermissions.includes('quotes:view') &&
            (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
        if (!canViewAll) {
            where.salesRepUserId = userId;
        }
        if (filters.companyId)
            where.companyId = filters.companyId;
        if (filters.projectId)
            where.projectId = filters.projectId;
        if (filters.salesRepUserId)
            where.salesRepUserId = filters.salesRepUserId;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        const [allQuotes, wonQuotes, lostQuotes, pendingQuotes] = await Promise.all([
            this.prisma.quote.findMany({ where, select: { id: true, grandTotal: true, status: true, submittedAt: true, approvedAt: true } }),
            this.prisma.quote.findMany({ where: { ...where, status: client_1.QuoteStatus.WON }, select: { grandTotal: true } }),
            this.prisma.quote.findMany({ where: { ...where, status: client_1.QuoteStatus.LOST }, select: { grandTotal: true } }),
            this.prisma.quote.findMany({ where: { ...where, status: client_1.QuoteStatus.PENDING_APPROVAL }, select: { grandTotal: true } }),
        ]);
        const totalQuotes = allQuotes.length;
        const wins = wonQuotes.length;
        const losses = lostQuotes.length;
        const winRate = totalQuotes > 0 ? (wins / (wins + losses)) * 100 : 0;
        const totalValue = allQuotes.reduce((sum, q) => sum.add(q.grandTotal), new library_1.Decimal(0));
        const avgQuoteValue = totalQuotes > 0 ? totalValue.div(totalQuotes) : new library_1.Decimal(0);
        const pipelineValue = pendingQuotes.reduce((sum, q) => sum.add(q.grandTotal), new library_1.Decimal(0));
        const wonValue = wonQuotes.reduce((sum, q) => sum.add(q.grandTotal), new library_1.Decimal(0));
        const approvedQuotes = allQuotes.filter(q => q.submittedAt && q.approvedAt);
        let avgApprovalTime = 0;
        if (approvedQuotes.length > 0) {
            const totalApprovalTime = approvedQuotes.reduce((sum, q) => {
                const time = q.approvedAt.getTime() - q.submittedAt.getTime();
                return sum + time;
            }, 0);
            avgApprovalTime = totalApprovalTime / approvedQuotes.length / (1000 * 60 * 60);
        }
        return {
            totalQuotes,
            wins,
            losses,
            winRate: parseFloat(winRate.toFixed(2)),
            avgQuoteValue: parseFloat(avgQuoteValue.toFixed(2)),
            pipelineValue: parseFloat(pipelineValue.toFixed(2)),
            wonValue: parseFloat(wonValue.toFixed(2)),
            avgApprovalTimeHours: parseFloat(avgApprovalTime.toFixed(2)),
        };
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        quote_archiving_service_1.QuoteArchivingService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map