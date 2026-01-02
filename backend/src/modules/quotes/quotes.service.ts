import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, DeliveryMethod, ApprovalAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  // Generate unique quote number: Q-YYYYMM-####
  private async generateQuoteNumber(): Promise<string> {
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
      
      // Verify uniqueness
      const exists = await tx.quote.findUnique({ where: { quoteNumber } });
      if (exists) {
        throw new Error('Quote number collision');
      }

      return quoteNumber;
    });
  }

  // Calculate transport cost
  private async calculateTransport(routeId: string | null | undefined): Promise<{ base: Decimal; tolls: Decimal; total: Decimal; distanceKm: Decimal; costPerKm: Decimal }> {
    if (!routeId) {
      return { base: new Decimal(0), tolls: new Decimal(0), total: new Decimal(0), distanceKm: new Decimal(0), costPerKm: new Decimal(0) };
    }

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: { tolls: true },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const distanceKm = new Decimal(route.distanceKm);
    const costPerKm = new Decimal(route.costPerKm);
    const transportBase = distanceKm.mul(costPerKm);
    const tollTotal = route.tolls.reduce((sum, toll) => sum.add(new Decimal(toll.cost)), new Decimal(0));
    const transportTotal = transportBase.add(tollTotal);

    return {
      base: transportBase,
      tolls: tollTotal,
      total: transportTotal,
      distanceKm,
      costPerKm,
    };
  }

  // Validate quote item
  private async validateQuoteItem(stockItemId: string, qty: number, unitPrice: number, discount: number): Promise<{ name: string; uom: string; minUnitPrice: Decimal; minOrderQty: Decimal; truckloadOnly: boolean }> {
    const stockItem = await this.prisma.stockItem.findUnique({
      where: { id: stockItemId },
    });

    if (!stockItem) {
      throw new NotFoundException(`Stock item ${stockItemId} not found`);
    }

    if (!stockItem.isActive) {
      throw new BadRequestException(`Stock item ${stockItem.name} is not active`);
    }

    const qtyDecimal = new Decimal(qty);
    const unitPriceDecimal = new Decimal(unitPrice);
    const discountDecimal = new Decimal(discount);
    const finalPrice = unitPriceDecimal.sub(discountDecimal);

    // Validate min unit price
    if (finalPrice.lt(stockItem.minUnitPrice)) {
      throw new BadRequestException(
        `Unit price (${finalPrice}) cannot be below minimum (${stockItem.minUnitPrice}) for ${stockItem.name}`,
      );
    }

    // Validate min order qty
    if (qtyDecimal.lt(stockItem.minOrderQty)) {
      throw new BadRequestException(
        `Quantity (${qty}) must be at least ${stockItem.minOrderQty} for ${stockItem.name}`,
      );
    }

    // Validate truckload multiples
    if (stockItem.truckloadOnly) {
      const remainder = qtyDecimal.mod(stockItem.minOrderQty);
      if (!remainder.eq(0)) {
        throw new BadRequestException(
          `Quantity for ${stockItem.name} must be a multiple of ${stockItem.minOrderQty} (truckload only)`,
        );
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

  async findAll(
    userId: string,
    userPermissions: string[],
    filters: {
      status?: QuoteStatus;
      companyId?: string;
      projectId?: string;
      salesRepUserId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Sales reps see only their quotes unless they have quotes:view_all or are admin
    const canViewAll = userPermissions.includes('quotes:view') && 
      (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
    
    if (!canViewAll) {
      where.salesRepUserId = userId;
    }

    if (filters.status) where.status = filters.status;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.salesRepUserId) where.salesRepUserId = filters.salesRepUserId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
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

  async findOne(id: string, userId: string, userPermissions: string[]) {
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
      throw new NotFoundException('Quote not found');
    }

    // Sales reps can only view their own quotes unless elevated permission
    const canViewAll = userPermissions.includes('quotes:view') && 
      (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
    
    if (!canViewAll && quote.salesRepUserId !== userId) {
      throw new ForbiddenException('You can only view your own quotes');
    }

    return quote;
  }

  async create(dto: CreateQuoteDto, userId: string) {
    // Validate company, project, customer exist
    const [company, project, customer] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: dto.companyId } }),
      this.prisma.project.findUnique({ where: { id: dto.projectId } }),
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
    ]);

    if (!company) throw new NotFoundException('Company not found');
    if (!project) throw new NotFoundException('Project not found');
    if (!customer) throw new NotFoundException('Customer not found');
    if (project.companyId !== company.id) {
      throw new BadRequestException('Project does not belong to the selected company');
    }

    // Validate contact if provided
    if (dto.contactId) {
      const contact = await this.prisma.contact.findUnique({ where: { id: dto.contactId } });
      if (!contact) throw new NotFoundException('Contact not found');
      if (contact.customerId !== customer.id) {
        throw new BadRequestException('Contact does not belong to the selected customer');
      }
    }

    // Validate delivery method and address
    if (dto.deliveryMethod === DeliveryMethod.DELIVERED && (!dto.deliveryAddressLine1 || !dto.deliveryCity || !dto.deliveryPostalCode)) {
      throw new BadRequestException('Delivery address (including city) is required for delivered quotes');
    }

    // Auto-match route based on warehouse location city (departure) or company city (fallback) and delivery city (destination)
    let routeId = dto.routeId;
    let departureCity: string | null = null;
    
    if (dto.deliveryMethod === DeliveryMethod.DELIVERED && !routeId) {
      if (!dto.deliveryCity) {
        throw new BadRequestException('Delivery city is required for route calculation');
      }
      
      // Try to get departure city from warehouse first, then fall back to company city
      if (dto.warehouseId) {
        const warehouse = await this.prisma.warehouse.findUnique({
          where: { id: dto.warehouseId },
        });
        if (warehouse?.locationCity) {
          departureCity = warehouse.locationCity;
        }
      }
      
      // Fall back to company city if warehouse doesn't have a city
      if (!departureCity && company.city) {
        departureCity = company.city;
      }
      
      if (!departureCity) {
        const locationHint = dto.warehouseId ? 'warehouse' : 'company';
        throw new BadRequestException(`The selected ${locationHint} does not have a city set. Please set the ${locationHint} city to enable automatic route matching.`);
      }
      
      const matchedRoute = await this.prisma.route.findFirst({
        where: {
          fromCity: departureCity,
          toCity: dto.deliveryCity,
        },
      });
      if (matchedRoute) {
        routeId = matchedRoute.id;
      } else {
        throw new BadRequestException(`No route found from ${departureCity} to ${dto.deliveryCity}. Please ensure the route exists in the system.`);
      }
    }
    
    // Validate that DELIVERED quotes have a route
    if (dto.deliveryMethod === DeliveryMethod.DELIVERED && !routeId) {
      throw new BadRequestException('Route is required for delivered quotes. Please ensure a route exists or the warehouse/company has a city set for automatic matching.');
    }

    // Calculate transport
    const transport = await this.calculateTransport(routeId);

    // Validate and process items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Quote must have at least one item');
    }

    // Get all stock items for the project
    const projectStockItems = await this.prisma.stockItem.findMany({
      where: { projectId: dto.projectId, isActive: true },
    });

    const stockItemMap = new Map(projectStockItems.map(item => [item.id, item]));

    let subtotal = new Decimal(0);
    let discountTotal = new Decimal(0);
    const quoteItems = [];

    for (const itemDto of dto.items) {
      const stockItem = stockItemMap.get(itemDto.stockItemId);
      if (!stockItem) {
        throw new NotFoundException(`Stock item ${itemDto.stockItemId} not found or not available for this project`);
      }

      const validation = await this.validateQuoteItem(
        itemDto.stockItemId,
        itemDto.qty,
        itemDto.unitPrice,
        itemDto.discount,
      );

      const qtyDecimal = new Decimal(itemDto.qty);
      const unitPriceDecimal = new Decimal(itemDto.unitPrice);
      const discountDecimal = new Decimal(itemDto.discount);
      const lineTotal = qtyDecimal.mul(unitPriceDecimal.sub(discountDecimal));

      subtotal = subtotal.add(qtyDecimal.mul(unitPriceDecimal));
      discountTotal = discountTotal.add(qtyDecimal.mul(discountDecimal));

      quoteItems.push({
        stockItemId: itemDto.stockItemId,
        nameSnapshot: validation.name,
        uomSnapshot: validation.uom,
        qty: qtyDecimal,
        unitPrice: unitPriceDecimal,
        discount: discountDecimal,
        lineTotal,
      });
    }

    const grandTotal = subtotal.sub(discountTotal).add(transport.total);

    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber();

    // Create quote with items
    return this.prisma.quote.create({
      data: {
        quoteNumber,
        companyId: dto.companyId,
        projectId: dto.projectId,
        customerId: dto.customerId,
        contactId: dto.contactId,
        deliveryMethod: dto.deliveryMethod,
        deliveryAddressLine1: dto.deliveryAddressLine1,
        deliveryAddressLine2: dto.deliveryAddressLine2,
        deliveryCity: dto.deliveryCity,
        deliveryState: dto.deliveryState,
        deliveryPostalCode: dto.deliveryPostalCode,
        deliveryCountry: dto.deliveryCountry,
        routeId: routeId,
        distanceKmSnapshot: transport.distanceKm,
        costPerKmSnapshot: transport.costPerKm,
        tollTotalSnapshot: transport.tolls,
        subtotal,
        discountTotal,
        transportTotal: transport.total,
        grandTotal,
        status: QuoteStatus.DRAFT,
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
  }

  async update(id: string, dto: UpdateQuoteDto, userId: string, userPermissions: string[]) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    // Check edit permissions
    if (quote.salesRepUserId !== userId && !userPermissions.includes('quotes:approve')) {
      throw new ForbiddenException('You can only edit your own quotes');
    }

    // Check status - only DRAFT and REJECTED can be edited
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REJECTED) {
      throw new BadRequestException(`Cannot edit quote with status ${quote.status}`);
    }

    // If items are being updated, recalculate
    if (dto.items && dto.items.length > 0) {
      // Similar validation as create
      const project = await this.prisma.project.findUnique({ where: { id: quote.projectId } });
      if (!project) throw new NotFoundException('Project not found');

      const projectStockItems = await this.prisma.stockItem.findMany({
        where: { projectId: project.id, isActive: true },
      });
      const stockItemMap = new Map(projectStockItems.map(item => [item.id, item]));

      let subtotal = new Decimal(0);
      let discountTotal = new Decimal(0);
      const quoteItems = [];

      for (const itemDto of dto.items) {
        const stockItem = stockItemMap.get(itemDto.stockItemId);
        if (!stockItem) {
          throw new NotFoundException(`Stock item ${itemDto.stockItemId} not found`);
        }

        const validation = await this.validateQuoteItem(
          itemDto.stockItemId,
          itemDto.qty,
          itemDto.unitPrice,
          itemDto.discount,
        );

        const qtyDecimal = new Decimal(itemDto.qty);
        const unitPriceDecimal = new Decimal(itemDto.unitPrice);
        const discountDecimal = new Decimal(itemDto.discount);
        const lineTotal = qtyDecimal.mul(unitPriceDecimal.sub(discountDecimal));

        subtotal = subtotal.add(qtyDecimal.mul(unitPriceDecimal));
        discountTotal = discountTotal.add(qtyDecimal.mul(discountDecimal));

        quoteItems.push({
          stockItemId: itemDto.stockItemId,
          nameSnapshot: validation.name,
          uomSnapshot: validation.uom,
          qty: qtyDecimal,
          unitPrice: unitPriceDecimal,
          discount: discountDecimal,
          lineTotal,
        });
      }

      // Recalculate transport if route changed
      // Auto-match route if delivery method is DELIVERED and city is provided
      let routeId = dto.routeId ?? quote.routeId;
      let departureCity: string | null = null;
      
      if (dto.deliveryMethod === DeliveryMethod.DELIVERED || (!dto.deliveryMethod && quote.deliveryMethod === DeliveryMethod.DELIVERED)) {
        const deliveryCity = dto.deliveryCity ?? quote.deliveryCity;
        if (deliveryCity && !routeId) {
          // Try to get departure city from warehouse first, then fall back to company city
          const warehouseId = dto.warehouseId ?? (quote as any).warehouseId;
          if (warehouseId) {
            const warehouse = await this.prisma.warehouse.findUnique({
              where: { id: warehouseId },
            });
            if (warehouse?.locationCity) {
              departureCity = warehouse.locationCity;
            }
          }
          
          // Fall back to company city if warehouse doesn't have a city
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
      const transport = await this.calculateTransport(routeId);
      const grandTotal = subtotal.sub(discountTotal).add(transport.total);

      // Update quote and replace items
      return this.prisma.$transaction([
        this.prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
        this.prisma.quote.update({
          where: { id },
          data: {
            ...dto,
            subtotal,
            discountTotal,
            transportTotal: transport.total,
            grandTotal,
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
    } else {
      // Just update quote fields
      return this.prisma.quote.update({
        where: { id },
        data: dto as any,
        include: {
          company: true,
          project: true,
          customer: true,
          items: { include: { stockItem: true } },
        },
      });
    }
  }

  async submit(id: string, userId: string, notes?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.salesRepUserId !== userId) {
      throw new ForbiddenException('You can only submit your own quotes');
    }
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REJECTED) {
      throw new BadRequestException(`Cannot submit quote with status ${quote.status}`);
    }
    if (quote.items.length === 0) {
      throw new BadRequestException('Cannot submit quote without items');
    }

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.PENDING_APPROVAL,
          submittedAt: new Date(),
        },
      }),
      this.prisma.quoteApprovalAudit.create({
        data: {
          quoteId: id,
          action: ApprovalAction.SUBMIT,
          actorUserId: userId,
          notes,
        },
      }),
    ]).then(() => this.findOne(id, userId, ['quotes:view']));
  }

  async approve(id: string, userId: string, userPermissions: string[], notes?: string) {
    if (!userPermissions.includes('quotes:approve')) {
      throw new ForbiddenException('You do not have permission to approve quotes');
    }

    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve quote with status ${quote.status}`);
    }

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.APPROVED,
          approvedAt: new Date(),
        },
      }),
      this.prisma.quoteApprovalAudit.create({
        data: {
          quoteId: id,
          action: ApprovalAction.APPROVE,
          actorUserId: userId,
          notes,
        },
      }),
    ]).then(() => this.findOne(id, userId, userPermissions));
  }

  async reject(id: string, userId: string, userPermissions: string[], reason: string) {
    if (!userPermissions.includes('quotes:reject')) {
      throw new ForbiddenException('You do not have permission to reject quotes');
    }

    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject quote with status ${quote.status}`);
    }

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.REJECTED,
          rejectedAt: new Date(),
        },
      }),
      this.prisma.quoteApprovalAudit.create({
        data: {
          quoteId: id,
          action: ApprovalAction.REJECT,
          actorUserId: userId,
          notes: reason,
        },
      }),
    ]).then(() => this.findOne(id, userId, userPermissions));
  }

  async withdraw(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    
    if (quote.salesRepUserId !== userId) {
      throw new ForbiddenException('You can only withdraw your own quotes');
    }
    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot withdraw quote with status ${quote.status}. Only quotes pending approval can be withdrawn.`);
    }

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.DRAFT,
          submittedAt: null,
        },
      }),
      this.prisma.quoteApprovalAudit.create({
        data: {
          quoteId: id,
          action: ApprovalAction.WITHDRAW,
          actorUserId: userId,
        },
      }),
    ]).then(() => this.findOne(id, userId, ['quotes:view']));
  }

  async markOutcome(id: string, outcome: 'WON' | 'LOST', userId: string, userPermissions: string[], reasonCategory: string, reasonNotes?: string) {
    if (!userPermissions.includes('quotes:approve')) {
      throw new ForbiddenException('You do not have permission to mark quote outcomes');
    }

    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== QuoteStatus.APPROVED) {
      throw new BadRequestException('Can only mark outcome for approved quotes');
    }

    const status = outcome === 'WON' ? QuoteStatus.WON : QuoteStatus.LOST;
    const action = outcome === 'WON' ? ApprovalAction.MARK_WON : ApprovalAction.MARK_LOST;

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status,
          outcomeReasonCategory: reasonCategory,
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

  async remove(id: string, userId: string, userPermissions: string[]) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    if (quote.salesRepUserId !== userId && !userPermissions.includes('quotes:approve')) {
      throw new ForbiddenException('You can only delete your own quotes');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft quotes');
    }

    return this.prisma.quote.delete({ where: { id } });
  }
  // KPI calculations
  async getSalesKPIs(
    userId: string,
    userPermissions: string[],
    filters: {
      companyId?: string;
      projectId?: string;
      salesRepUserId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = {};

    const canViewAll = userPermissions.includes('quotes:view') && 
      (userPermissions.includes('system:manage_users') || userPermissions.includes('quotes:approve'));
    
    if (!canViewAll) {
      where.salesRepUserId = userId;
    }

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.salesRepUserId) where.salesRepUserId = filters.salesRepUserId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [allQuotes, wonQuotes, lostQuotes, pendingQuotes] = await Promise.all([
      this.prisma.quote.findMany({ where, select: { id: true, grandTotal: true, status: true, submittedAt: true, approvedAt: true } }),
      this.prisma.quote.findMany({ where: { ...where, status: QuoteStatus.WON }, select: { grandTotal: true } }),
      this.prisma.quote.findMany({ where: { ...where, status: QuoteStatus.LOST }, select: { grandTotal: true } }),
      this.prisma.quote.findMany({ where: { ...where, status: QuoteStatus.PENDING_APPROVAL }, select: { grandTotal: true } }),
    ]);

    const totalQuotes = allQuotes.length;
    const wins = wonQuotes.length;
    const losses = lostQuotes.length;
    const winRate = totalQuotes > 0 ? (wins / (wins + losses)) * 100 : 0;

    const totalValue = allQuotes.reduce((sum, q) => sum.add(q.grandTotal), new Decimal(0));
    const avgQuoteValue = totalQuotes > 0 ? totalValue.div(totalQuotes) : new Decimal(0);
    const pipelineValue = pendingQuotes.reduce((sum, q) => sum.add(q.grandTotal), new Decimal(0));
    const wonValue = wonQuotes.reduce((sum, q) => sum.add(q.grandTotal), new Decimal(0));

    // Calculate avg approval time
    const approvedQuotes = allQuotes.filter(q => q.submittedAt && q.approvedAt);
    let avgApprovalTime = 0;
    if (approvedQuotes.length > 0) {
      const totalApprovalTime = approvedQuotes.reduce((sum, q) => {
        const time = q.approvedAt!.getTime() - q.submittedAt!.getTime();
        return sum + time;
      }, 0);
      avgApprovalTime = totalApprovalTime / approvedQuotes.length / (1000 * 60 * 60); // Convert to hours
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
}
