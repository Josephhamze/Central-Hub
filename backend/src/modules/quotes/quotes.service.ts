import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QuoteArchivingService } from './quote-archiving.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, DeliveryMethod, ApprovalAction, PaymentTerms, TruckType, LossReasonCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private quoteArchivingService: QuoteArchivingService,
  ) {}

  /**
   * Calculate expiresAt based on approvedAt or createdAt + validityDays
   */
  private calculateExpiresAt(approvedAt: Date | null, createdAt: Date, validityDays: number): Date | null {
    // If approved, use approvedAt + validityDays
    if (approvedAt) {
      const expiresAt = new Date(approvedAt);
      expiresAt.setDate(expiresAt.getDate() + validityDays);
      return expiresAt;
    }
    // Otherwise, use createdAt + validityDays (for draft quotes that might be approved later)
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + validityDays);
    return expiresAt;
  }

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

  // Calculate service end date based on delivery start date, loads per day, and total tonnage
  private calculateServiceEndDate(
    deliveryStartDate: Date | null | undefined,
    loadsPerDay: number | null | undefined,
    truckType: string | null | undefined,
    totalTonnage: Decimal,
  ): Date | null {
    if (!deliveryStartDate || !loadsPerDay || !truckType) {
      return null;
    }

    // Truck capacity in tons
    const truckCapacity = truckType === 'TIPPER_42T' ? 42 : 40; // FLATBED_40T = 40 tons

    // Calculate number of loads needed
    const numberOfLoads = Math.ceil(totalTonnage.toNumber() / truckCapacity);

    // Calculate number of days needed
    const numberOfDays = Math.ceil(numberOfLoads / loadsPerDay);

    // Calculate service end date
    const endDate = new Date(deliveryStartDate);
    endDate.setDate(endDate.getDate() + numberOfDays);

    return endDate;
  }

  // Calculate transport cost
  // Formula: (set $ amount * distance * total tonnage) + tolls
  private async calculateTransport(routeId: string | null | undefined, items: Array<{ qty: Decimal; uomSnapshot: string }> = []): Promise<{ base: Decimal; tolls: Decimal; total: Decimal; distanceKm: Decimal; costPerKm: Decimal; totalTonnage: Decimal }> {
    if (!routeId) {
      return { base: new Decimal(0), tolls: new Decimal(0), total: new Decimal(0), distanceKm: new Decimal(0), costPerKm: new Decimal(0), totalTonnage: new Decimal(0) };
    }

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: { tolls: true },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const distanceKm = new Decimal(route.distanceKm);
    
    // Route rate per km is required for transport calculation
    if (!route.costPerKm || route.costPerKm.eq(0)) {
      throw new BadRequestException('Route rate per km (costPerKm) is required for transport calculation. Please set the rate per km on the route.');
    }
    const costPerKm = new Decimal(route.costPerKm);
    
    // Calculate total tonnage from items
    // Convert all quantities to tons (assuming UOM is in tons, kg, or other units)
    let totalTonnage = new Decimal(0);
    for (const item of items) {
      const qty = new Decimal(item.qty);
      const uom = item.uomSnapshot.toUpperCase();
      
      // Convert to tons based on UOM
      if (uom === 'TON' || uom === 'TONS' || uom === 'T') {
        totalTonnage = totalTonnage.add(qty);
      } else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
        totalTonnage = totalTonnage.add(qty.div(1000)); // Convert kg to tons
      } else if (uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
        totalTonnage = totalTonnage.add(qty);
      } else {
        // For other UOMs, assume they're already in tons or use quantity as-is
        // You may need to adjust this based on your business logic
        totalTonnage = totalTonnage.add(qty);
      }
    }
    
    // If no tonnage calculated, default to 1 to avoid zero cost
    if (totalTonnage.eq(0)) {
      totalTonnage = new Decimal(1);
    }
    
    // Formula: (total tonnage * route rate per km * km) + tolls
    // Exact formula: total tonnage × route rate per km × distance km
    const transportBase = totalTonnage.mul(costPerKm).mul(distanceKm);
    const tollTotal = route.tolls.reduce((sum, toll) => sum.add(new Decimal(toll.cost)), new Decimal(0));
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

  // Validate quote item
  private async validateQuoteItem(stockItemId: string, qty: number, unitPrice: number, discountPercentage: number): Promise<{ name: string; uom: string; minUnitPrice: Decimal; minOrderQty: Decimal; truckloadOnly: boolean }> {
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
    const discountPercentageDecimal = new Decimal(discountPercentage || 0);
    const discountAmount = unitPriceDecimal.mul(discountPercentageDecimal).div(100);
    const finalPrice = unitPriceDecimal.sub(discountAmount);

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
      includeArchived?: boolean;
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
    // Exclude archived quotes by default (unless explicitly requested)
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
    if (dto.deliveryMethod === DeliveryMethod.DELIVERED && !dto.deliveryAddressLine1) {
      throw new BadRequestException('Delivery address is required for delivered quotes');
    }

    // Auto-match route based on warehouse location city (departure) or company city (fallback) and delivery address (destination)
    let routeId = dto.routeId;
    let departureCity: string | null = null;
    
    if (dto.deliveryMethod === DeliveryMethod.DELIVERED && !routeId) {
      if (!dto.deliveryAddressLine1) {
        throw new BadRequestException('Delivery address is required for route calculation');
      }
      
      // Extract city from address if not provided separately (try to get city from address string)
      let deliveryCity: string | null = null;
      if (dto.deliveryCity) {
        deliveryCity = dto.deliveryCity;
      } else if (dto.deliveryAddressLine1) {
        // Try to extract city from address (usually the second-to-last part before country, or last part)
        const addressParts = dto.deliveryAddressLine1.split(',').map(p => p.trim());
        if (addressParts.length >= 2) {
          // Usually format is: "Street, City, Country" or "Street, City"
          deliveryCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1];
        } else {
          deliveryCity = addressParts[0]; // Fallback to full address if no comma
        }
      }
      
      if (!deliveryCity) {
        throw new BadRequestException('Could not determine delivery city from address. Please ensure the address includes the city name.');
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
        // Don't throw error - allow saving draft without route
        // Route will be required when submitting for approval
        routeId = undefined;
      } else {
        const matchedRoute = await this.prisma.route.findFirst({
          where: {
            fromCity: departureCity,
            toCity: deliveryCity,
          },
        });
        if (matchedRoute) {
          routeId = matchedRoute.id;
        }
        // If no route found, allow saving as draft - route will be required when submitting for approval
      }
    }
    
    // Note: Route validation for DELIVERED quotes is done in the submit() method, not here
    // This allows quotes to be saved as drafts without a route

    // Calculate transport (will be recalculated after items are processed)
    // We'll calculate it after processing items to get tonnage

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
        itemDto.discountPercentage || 0,
      );

      const qtyDecimal = new Decimal(itemDto.qty);
      const unitPriceDecimal = new Decimal(itemDto.unitPrice);
      const discountPercentageDecimal = new Decimal(itemDto.discountPercentage || 0);
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

    // Calculate transport with items for tonnage
    const transport = await this.calculateTransport(routeId, quoteItems.map(item => ({ qty: item.qty, uomSnapshot: item.uomSnapshot })));
    const grandTotal = subtotal.sub(discountTotal).add(transport.total);

    // Calculate service end date based on delivery start date, loads per day, and total tonnage
    const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : null;
    const serviceEndDate = this.calculateServiceEndDate(
      deliveryStartDate,
      dto.loadsPerDay || null,
      dto.truckType || null,
      transport.totalTonnage,
    );

    // Validate validityDays - default 7, admins can set more
    const validityDays = dto.validityDays || 7;
    // Note: Admin check should be done in controller/service based on permissions
    // For now, we allow any value >= 1, but UI should restrict non-admins to 7
    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber();

    // Calculate expiresAt (will be recalculated when approved)
    const createdAt = new Date();
    const expiresAt = this.calculateExpiresAt(null, createdAt, validityDays);

    // Create quote with items
    return this.prisma.quote.create({
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
        deliveryCity: dto.deliveryCity || null, // Keep for backward compatibility but allow null
        deliveryState: dto.deliveryState,
        deliveryPostalCode: dto.deliveryPostalCode,
        deliveryCountry: dto.deliveryCountry,
        routeId: routeId,
        distanceKmSnapshot: transport.distanceKm,
        costPerKmSnapshot: transport.costPerKm,
        tollTotalSnapshot: transport.tolls,
        subtotal,
        discountPercentage: subtotal.gt(0) ? discountTotal.div(subtotal).mul(100) : new Decimal(0),
        transportTotal: transport.total,
        grandTotal,
        validityDays,
        paymentTerms: dto.paymentTerms,
        deliveryStartDate: deliveryStartDate,
        serviceEndDate: serviceEndDate,
        loadsPerDay: dto.loadsPerDay,
        truckType: dto.truckType,
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
          itemDto.discountPercentage || 0,
        );

        const qtyDecimal = new Decimal(itemDto.qty);
        const unitPriceDecimal = new Decimal(itemDto.unitPrice);
        const discountPercentageDecimal = new Decimal(itemDto.discountPercentage || 0);
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

      // Recalculate transport if route changed
      // Auto-match route if delivery method is DELIVERED and city is provided
      let routeId = dto.routeId ?? quote.routeId;
      let departureCity: string | null = null;
      
      if (dto.deliveryMethod === DeliveryMethod.DELIVERED || (!dto.deliveryMethod && quote.deliveryMethod === DeliveryMethod.DELIVERED)) {
        // Extract city from address if not provided separately
        let deliveryCity: string | null = dto.deliveryCity ?? quote.deliveryCity;
        if (!deliveryCity && (dto.deliveryAddressLine1 || quote.deliveryAddressLine1)) {
          const address = dto.deliveryAddressLine1 || quote.deliveryAddressLine1 || '';
          const addressParts = address.split(',').map(p => p.trim());
          if (addressParts.length >= 2) {
            deliveryCity = addressParts[addressParts.length - 2] || addressParts[addressParts.length - 1];
          } else {
            deliveryCity = addressParts[0];
          }
        }
        
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
      // Calculate transport with items for tonnage
      const transport = await this.calculateTransport(routeId, quoteItems.map(item => ({ qty: item.qty, uomSnapshot: item.uomSnapshot })));
      const grandTotal = subtotal.sub(discountTotal).add(transport.total);

      // Calculate service end date based on delivery start date, loads per day, and total tonnage
      const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : (quote.deliveryStartDate || null);
      const loadsPerDay = dto.loadsPerDay !== undefined ? dto.loadsPerDay : quote.loadsPerDay;
      const truckType = dto.truckType !== undefined ? dto.truckType : quote.truckType;
      const serviceEndDate = this.calculateServiceEndDate(
        deliveryStartDate,
        loadsPerDay,
        truckType,
        transport.totalTonnage,
      );

      // Update quote and replace items
      return this.prisma.$transaction([
        this.prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
        this.prisma.quote.update({
          where: { id },
          data: {
            ...dto,
            subtotal,
            discountPercentage: subtotal.gt(0) ? discountTotal.div(subtotal).mul(100) : new Decimal(0),
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
    } else {
      // Just update quote fields - but recalculate serviceEndDate if delivery terms changed
      const deliveryStartDate = dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : (quote.deliveryStartDate || null);
      const loadsPerDay = dto.loadsPerDay !== undefined ? dto.loadsPerDay : quote.loadsPerDay;
      const truckType = dto.truckType !== undefined ? dto.truckType : quote.truckType;
      
      // Get existing items to calculate tonnage
      const existingItems = await this.prisma.quoteItem.findMany({
        where: { quoteId: id },
      });
      
      // Calculate total tonnage from existing items
      let totalTonnage = new Decimal(0);
      for (const item of existingItems) {
        const qty = new Decimal(item.qty);
        const uom = item.uomSnapshot.toUpperCase();
        
        if (uom === 'TON' || uom === 'TONS' || uom === 'T') {
          totalTonnage = totalTonnage.add(qty);
        } else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
          totalTonnage = totalTonnage.add(qty.div(1000));
        } else if (uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
          totalTonnage = totalTonnage.add(qty);
        } else {
          totalTonnage = totalTonnage.add(qty);
        }
      }
      
      const serviceEndDate = this.calculateServiceEndDate(
        deliveryStartDate,
        loadsPerDay,
        truckType,
        totalTonnage,
      );
      
      return this.prisma.quote.update({
        where: { id },
        data: {
          ...dto,
          serviceEndDate: serviceEndDate !== undefined ? serviceEndDate : undefined,
          deliveryStartDate: dto.deliveryStartDate ? new Date(dto.deliveryStartDate) : undefined,
        } as any,
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
    // Check if route is required for DELIVERED quotes
    if (quote.deliveryMethod === DeliveryMethod.DELIVERED && !quote.routeId) {
      throw new BadRequestException('A route is required for delivered quotes. Please request a route or select an existing one before submitting.');
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

    const approvedAt = new Date();
    const expiresAt = this.calculateExpiresAt(approvedAt, quote.createdAt, quote.validityDays);
    
    const result = await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.APPROVED,
          approvedAt,
          expiresAt,
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
    ]);
    
    // Notify quote creator (don't fail if notification fails)
    if (quote.salesRepUserId) {
      try {
        await this.notificationsService.create(
          quote.salesRepUserId,
          'quote_approved',
          'Quote Approved',
          `Your quote ${quote.quoteNumber} has been approved.`,
          `/sales/quotes/${id}`,
        );
      } catch (error) {
        // Log but don't fail the approval if notification fails
        console.error('Failed to create approval notification:', error);
      }
    }
    
    return this.findOne(id, userId, userPermissions);
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

    const result = await this.prisma.$transaction([
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
    ]);
    
    // Notify quote creator
    if (quote.salesRepUserId) {
      await this.notificationsService.create(
        quote.salesRepUserId,
        'quote_rejected',
        'Quote Rejected',
        `Your quote ${quote.quoteNumber} has been rejected. Reason: ${reason}`,
        `/sales/quotes/${id}`,
      );
    }
    
    return this.findOne(id, userId, userPermissions);
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

  async markOutcome(id: string, outcome: 'WON' | 'LOST', userId: string, userPermissions: string[], lossReasonCategory?: LossReasonCategory, reasonNotes?: string) {
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
    const now = new Date();

    return this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: {
          status,
          lossReasonCategory: outcome === 'LOST' ? (lossReasonCategory || null) : null,
          outcomeReasonNotes: reasonNotes,
          // Archive immediately when marked as WON or LOST (will be archived after month ends by scheduled task)
          // Note: We don't set archived=true here because the requirement is to archive after the month is over
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

    // Check if user is admin (has quotes:approve permission typically means admin)
    const isAdmin = userPermissions.includes('quotes:approve');
    const isCreator = quote.salesRepUserId === userId;

    // Admins can delete any quote
    if (isAdmin) {
      return this.prisma.quote.delete({ where: { id } });
    }

    // Regular users can only delete their own draft quotes
    if (!isCreator) {
      throw new ForbiddenException('You can only delete your own quotes');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('You can only delete draft quotes');
    }

    return this.prisma.quote.delete({ where: { id } });
  }

  async archive(id: string, userId: string, userPermissions: string[]) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    // Check if user has permission to archive quotes
    if (!userPermissions.includes('quotes:approve') && quote.salesRepUserId !== userId) {
      throw new ForbiddenException('You do not have permission to archive this quote');
    }

    // Only allow archiving quotes that are WON, LOST, or REJECTED
    const archivableStatuses: QuoteStatus[] = [QuoteStatus.WON, QuoteStatus.LOST, QuoteStatus.REJECTED];
    if (!archivableStatuses.includes(quote.status)) {
      throw new BadRequestException('Can only archive quotes that are WON, LOST, or REJECTED');
    }

    // Don't archive if already archived
    if (quote.archived) {
      throw new BadRequestException('Quote is already archived');
    }

    await this.quoteArchivingService.archiveQuote(id);
    return this.findOne(id, userId, userPermissions);
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
