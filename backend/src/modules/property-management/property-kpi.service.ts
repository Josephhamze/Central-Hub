import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PropertyStatus,
  PropertyHealthStatus,
  RentPaymentStatus,
  BillStatus,
  MaintenanceStatus,
  Prisma,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyKPIs {
  propertyId: string;
  propertyCode: string;
  propertyName: string;

  // Operational KPIs
  occupancyRate: number;
  vacancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  avgLeaseDurationMonths: number;
  tenantTurnoverRate: number;
  activeLeases: number;
  expiringLeases30: number;
  expiringLeases60: number;
  expiringLeases90: number;

  // Financial KPIs
  monthlyRentalIncome: number;
  annualRentalIncome: number;
  rentBilled: number;
  rentCollected: number;
  collectionRate: number;
  arrearsAmount: number;
  arrearsPercentage: number;
  operatingExpenses: number;
  maintenanceCosts: number;
  utilityCosts: number;
  netOperatingIncome: number;
  grossYield: number;
  netYield: number;
  cashFlow: number;

  // Property Value
  marketValue: number;
  capRate: number;

  // Health Status
  healthStatus: PropertyHealthStatus;
}

export interface PortfolioKPIs {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  portfolioOccupancyRate: number;
  totalMarketValue: number;
  totalMonthlyRentalIncome: number;
  totalAnnualRentalIncome: number;
  totalRentBilled: number;
  totalRentCollected: number;
  portfolioCollectionRate: number;
  totalArrears: number;
  arrearsPercentage: number;
  totalOperatingExpenses: number;
  totalMaintenanceCosts: number;
  totalUtilityCosts: number;
  portfolioNOI: number;
  portfolioGrossYield: number;
  portfolioNetYield: number;
  propertiesByHealth: Record<PropertyHealthStatus, number>;
  propertiesByStatus: Record<PropertyStatus, number>;
}

export interface ForecastScenario {
  name: string;
  assumptions: {
    rentChangePercent: number;
    vacancyRatePercent: number;
    expenseChangePercent: number;
  };
  projectedIncome: number;
  projectedExpenses: number;
  projectedNOI: number;
  projectedYield: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PropertyKPIService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // PROPERTY-LEVEL KPIs
  // --------------------------------------------------------------------------

  async calculatePropertyKPIs(propertyId: string, period?: { startDate?: Date; endDate?: Date }): Promise<PropertyKPIs> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: true,
        leases: {
          where: { isActive: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const now = new Date();
    const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Calculate occupancy
    const totalUnits = property.units.length > 0 ? property.units.length : 1;
    const occupiedUnits = property.units.length > 0
      ? property.units.filter(u => u.status === PropertyStatus.OCCUPIED).length
      : (property.status === PropertyStatus.OCCUPIED ? 1 : 0);
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = (occupiedUnits / totalUnits) * 100;
    const vacancyRate = 100 - occupancyRate;

    // Calculate lease metrics
    const activeLeases = property.leases.length;
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringLeases30 = property.leases.filter(l => l.endDate && l.endDate <= thirtyDays && l.endDate > now).length;
    const expiringLeases60 = property.leases.filter(l => l.endDate && l.endDate <= sixtyDays && l.endDate > now).length;
    const expiringLeases90 = property.leases.filter(l => l.endDate && l.endDate <= ninetyDays && l.endDate > now).length;

    // Calculate average lease duration
    let totalLeaseDuration = 0;
    for (const lease of property.leases) {
      if (lease.endDate) {
        const duration = (lease.endDate.getTime() - lease.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalLeaseDuration += duration;
      }
    }
    const avgLeaseDurationMonths = activeLeases > 0 ? totalLeaseDuration / activeLeases : 0;

    // Calculate tenant turnover (terminated leases this year / total leases)
    const terminatedThisYear = await this.prisma.lease.count({
      where: {
        propertyId,
        isActive: false,
        terminatedDate: { gte: yearStart },
      },
    });
    const tenantTurnoverRate = activeLeases > 0 ? (terminatedThisYear / activeLeases) * 100 : 0;

    // Calculate financial KPIs
    const rentSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        lease: { propertyId },
        dueDate: { gte: startDate, lte: endDate },
      },
    });

    const rentBilled = rentSchedules.reduce((sum, s) => sum + s.totalDue.toNumber(), 0);
    const rentCollected = rentSchedules.reduce((sum, s) => sum + s.amountPaid.toNumber(), 0);
    const collectionRate = rentBilled > 0 ? (rentCollected / rentBilled) * 100 : 0;

    // Calculate arrears
    const arrearsSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        lease: { propertyId },
        status: { in: [RentPaymentStatus.OVERDUE, RentPaymentStatus.PARTIAL] },
        balance: { gt: 0 },
      },
    });
    const arrearsAmount = arrearsSchedules.reduce((sum, s) => sum + s.balance.toNumber(), 0);
    const arrearsPercentage = rentBilled > 0 ? (arrearsAmount / rentBilled) * 100 : 0;

    // Calculate monthly rental income from active leases
    const monthlyRentalIncome = property.leases.reduce((sum, l) => sum + l.rentAmount.toNumber(), 0);
    const annualRentalIncome = monthlyRentalIncome * 12;

    // Calculate expenses
    const expenses = await this.prisma.propertyExpense.aggregate({
      where: {
        propertyId,
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    const operatingExpenses = expenses._sum.totalAmount?.toNumber() || 0;

    // Calculate maintenance costs
    const maintenanceResult = await this.prisma.propertyMaintenanceJob.aggregate({
      where: {
        propertyId,
        status: MaintenanceStatus.COMPLETED,
        completedDate: { gte: startDate, lte: endDate },
      },
      _sum: { actualCost: true },
    });
    const maintenanceCosts = maintenanceResult._sum.actualCost?.toNumber() || 0;

    // Calculate utility costs
    const utilityResult = await this.prisma.utilityBill.aggregate({
      where: {
        propertyId,
        billingPeriodStart: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    const utilityCosts = utilityResult._sum.totalAmount?.toNumber() || 0;

    // Calculate NOI (Net Operating Income)
    const totalExpenses = operatingExpenses + maintenanceCosts + utilityCosts;
    const netOperatingIncome = rentCollected - totalExpenses;

    // Calculate yields
    const marketValue = property.currentMarketValue?.toNumber() || 0;
    const grossYield = marketValue > 0 ? (annualRentalIncome / marketValue) * 100 : 0;
    const netYield = marketValue > 0 ? ((annualRentalIncome - (totalExpenses * 12)) / marketValue) * 100 : 0;

    // Calculate cap rate
    const capRate = marketValue > 0 ? ((netOperatingIncome * 12) / marketValue) * 100 : 0;

    // Calculate cash flow
    const cashFlow = rentCollected - totalExpenses;

    // Determine health status
    const healthStatus = this.calculateHealthStatus({
      occupancyRate,
      collectionRate,
      arrearsPercentage,
      netYield,
    });

    return {
      propertyId: property.id,
      propertyCode: property.propertyCode,
      propertyName: property.name,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      vacancyRate: Math.round(vacancyRate * 100) / 100,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      avgLeaseDurationMonths: Math.round(avgLeaseDurationMonths * 10) / 10,
      tenantTurnoverRate: Math.round(tenantTurnoverRate * 100) / 100,
      activeLeases,
      expiringLeases30,
      expiringLeases60,
      expiringLeases90,
      monthlyRentalIncome: Math.round(monthlyRentalIncome * 100) / 100,
      annualRentalIncome: Math.round(annualRentalIncome * 100) / 100,
      rentBilled: Math.round(rentBilled * 100) / 100,
      rentCollected: Math.round(rentCollected * 100) / 100,
      collectionRate: Math.round(collectionRate * 100) / 100,
      arrearsAmount: Math.round(arrearsAmount * 100) / 100,
      arrearsPercentage: Math.round(arrearsPercentage * 100) / 100,
      operatingExpenses: Math.round(operatingExpenses * 100) / 100,
      maintenanceCosts: Math.round(maintenanceCosts * 100) / 100,
      utilityCosts: Math.round(utilityCosts * 100) / 100,
      netOperatingIncome: Math.round(netOperatingIncome * 100) / 100,
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      cashFlow: Math.round(cashFlow * 100) / 100,
      marketValue,
      capRate: Math.round(capRate * 100) / 100,
      healthStatus,
    };
  }

  // --------------------------------------------------------------------------
  // PORTFOLIO-LEVEL KPIs
  // --------------------------------------------------------------------------

  async calculatePortfolioKPIs(period?: { startDate?: Date; endDate?: Date }): Promise<PortfolioKPIs> {
    const properties = await this.prisma.property.findMany({
      include: {
        units: true,
        leases: { where: { isActive: true } },
      },
    });

    const now = new Date();
    const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let totalUnits = 0;
    let occupiedUnits = 0;
    let totalMarketValue = 0;
    let totalMonthlyRentalIncome = 0;

    const propertiesByHealth: Record<PropertyHealthStatus, number> = {
      [PropertyHealthStatus.HEALTHY]: 0,
      [PropertyHealthStatus.AT_RISK]: 0,
      [PropertyHealthStatus.UNDERPERFORMING]: 0,
      [PropertyHealthStatus.NON_PERFORMING]: 0,
    };

    const propertiesByStatus: Record<PropertyStatus, number> = {
      [PropertyStatus.VACANT]: 0,
      [PropertyStatus.OCCUPIED]: 0,
      [PropertyStatus.UNDER_MAINTENANCE]: 0,
      [PropertyStatus.LISTED]: 0,
      [PropertyStatus.INACTIVE]: 0,
    };

    for (const property of properties) {
      const units = property.units.length > 0 ? property.units.length : 1;
      totalUnits += units;

      const occupied = property.units.length > 0
        ? property.units.filter(u => u.status === PropertyStatus.OCCUPIED).length
        : (property.status === PropertyStatus.OCCUPIED ? 1 : 0);
      occupiedUnits += occupied;

      totalMarketValue += property.currentMarketValue?.toNumber() || 0;
      totalMonthlyRentalIncome += property.leases.reduce((sum, l) => sum + l.rentAmount.toNumber(), 0);

      propertiesByStatus[property.status]++;
      if (property.healthStatus) {
        propertiesByHealth[property.healthStatus]++;
      }
    }

    const vacantUnits = totalUnits - occupiedUnits;
    const portfolioOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const totalAnnualRentalIncome = totalMonthlyRentalIncome * 12;

    // Financial aggregations
    const [rentSchedules, expenses, maintenance, utilities] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where: {
          dueDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.propertyExpense.aggregate({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.propertyMaintenanceJob.aggregate({
        where: {
          status: MaintenanceStatus.COMPLETED,
          completedDate: { gte: startDate, lte: endDate },
        },
        _sum: { actualCost: true },
      }),
      this.prisma.utilityBill.aggregate({
        where: {
          billingPeriodStart: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRentBilled = rentSchedules.reduce((sum, s) => sum + s.totalDue.toNumber(), 0);
    const totalRentCollected = rentSchedules.reduce((sum, s) => sum + s.amountPaid.toNumber(), 0);
    const portfolioCollectionRate = totalRentBilled > 0 ? (totalRentCollected / totalRentBilled) * 100 : 0;

    // Arrears
    const arrearsSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        status: { in: [RentPaymentStatus.OVERDUE, RentPaymentStatus.PARTIAL] },
        balance: { gt: 0 },
      },
    });
    const totalArrears = arrearsSchedules.reduce((sum, s) => sum + s.balance.toNumber(), 0);
    const arrearsPercentage = totalRentBilled > 0 ? (totalArrears / totalRentBilled) * 100 : 0;

    const totalOperatingExpenses = expenses._sum.totalAmount?.toNumber() || 0;
    const totalMaintenanceCosts = maintenance._sum.actualCost?.toNumber() || 0;
    const totalUtilityCosts = utilities._sum.totalAmount?.toNumber() || 0;
    const totalExpenses = totalOperatingExpenses + totalMaintenanceCosts + totalUtilityCosts;

    const portfolioNOI = totalRentCollected - totalExpenses;
    const portfolioGrossYield = totalMarketValue > 0 ? (totalAnnualRentalIncome / totalMarketValue) * 100 : 0;
    const portfolioNetYield = totalMarketValue > 0 ? ((totalAnnualRentalIncome - (totalExpenses * 12)) / totalMarketValue) * 100 : 0;

    return {
      totalProperties: properties.length,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      portfolioOccupancyRate: Math.round(portfolioOccupancyRate * 100) / 100,
      totalMarketValue,
      totalMonthlyRentalIncome: Math.round(totalMonthlyRentalIncome * 100) / 100,
      totalAnnualRentalIncome: Math.round(totalAnnualRentalIncome * 100) / 100,
      totalRentBilled: Math.round(totalRentBilled * 100) / 100,
      totalRentCollected: Math.round(totalRentCollected * 100) / 100,
      portfolioCollectionRate: Math.round(portfolioCollectionRate * 100) / 100,
      totalArrears: Math.round(totalArrears * 100) / 100,
      arrearsPercentage: Math.round(arrearsPercentage * 100) / 100,
      totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      totalMaintenanceCosts: Math.round(totalMaintenanceCosts * 100) / 100,
      totalUtilityCosts: Math.round(totalUtilityCosts * 100) / 100,
      portfolioNOI: Math.round(portfolioNOI * 100) / 100,
      portfolioGrossYield: Math.round(portfolioGrossYield * 100) / 100,
      portfolioNetYield: Math.round(portfolioNetYield * 100) / 100,
      propertiesByHealth,
      propertiesByStatus,
    };
  }

  // --------------------------------------------------------------------------
  // KPI SNAPSHOTS
  // --------------------------------------------------------------------------

  async createKPISnapshot(propertyId: string) {
    const kpis = await this.calculatePropertyKPIs(propertyId);
    const now = new Date();
    const period = now.toISOString().slice(0, 7); // YYYY-MM

    // Update property health status
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { healthStatus: kpis.healthStatus },
    });

    // Create or update snapshot
    return this.prisma.propertyKPISnapshot.upsert({
      where: {
        propertyId_period: { propertyId, period },
      },
      create: {
        propertyId,
        snapshotDate: now,
        period,
        occupancyRate: new Prisma.Decimal(kpis.occupancyRate),
        vacancyRate: new Prisma.Decimal(kpis.vacancyRate),
        totalUnits: kpis.totalUnits,
        occupiedUnits: kpis.occupiedUnits,
        vacantUnits: kpis.vacantUnits,
        avgLeaseDuration: new Prisma.Decimal(kpis.avgLeaseDurationMonths),
        tenantTurnoverRate: new Prisma.Decimal(kpis.tenantTurnoverRate),
        activeLeases: kpis.activeLeases,
        expiringLeases30: kpis.expiringLeases30,
        expiringLeases60: kpis.expiringLeases60,
        expiringLeases90: kpis.expiringLeases90,
        rentalIncome: new Prisma.Decimal(kpis.monthlyRentalIncome),
        rentBilled: new Prisma.Decimal(kpis.rentBilled),
        rentCollected: new Prisma.Decimal(kpis.rentCollected),
        collectionRate: new Prisma.Decimal(kpis.collectionRate),
        arrearsAmount: new Prisma.Decimal(kpis.arrearsAmount),
        arrearsPercentage: new Prisma.Decimal(kpis.arrearsPercentage),
        operatingExpenses: new Prisma.Decimal(kpis.operatingExpenses),
        maintenanceCosts: new Prisma.Decimal(kpis.maintenanceCosts),
        utilityCosts: new Prisma.Decimal(kpis.utilityCosts),
        netOperatingIncome: new Prisma.Decimal(kpis.netOperatingIncome),
        grossYield: new Prisma.Decimal(kpis.grossYield),
        netYield: new Prisma.Decimal(kpis.netYield),
        cashFlow: new Prisma.Decimal(kpis.cashFlow),
        marketValue: new Prisma.Decimal(kpis.marketValue),
        capRate: new Prisma.Decimal(kpis.capRate),
        healthStatus: kpis.healthStatus,
      },
      update: {
        snapshotDate: now,
        occupancyRate: new Prisma.Decimal(kpis.occupancyRate),
        vacancyRate: new Prisma.Decimal(kpis.vacancyRate),
        totalUnits: kpis.totalUnits,
        occupiedUnits: kpis.occupiedUnits,
        vacantUnits: kpis.vacantUnits,
        avgLeaseDuration: new Prisma.Decimal(kpis.avgLeaseDurationMonths),
        tenantTurnoverRate: new Prisma.Decimal(kpis.tenantTurnoverRate),
        activeLeases: kpis.activeLeases,
        expiringLeases30: kpis.expiringLeases30,
        expiringLeases60: kpis.expiringLeases60,
        expiringLeases90: kpis.expiringLeases90,
        rentalIncome: new Prisma.Decimal(kpis.monthlyRentalIncome),
        rentBilled: new Prisma.Decimal(kpis.rentBilled),
        rentCollected: new Prisma.Decimal(kpis.rentCollected),
        collectionRate: new Prisma.Decimal(kpis.collectionRate),
        arrearsAmount: new Prisma.Decimal(kpis.arrearsAmount),
        arrearsPercentage: new Prisma.Decimal(kpis.arrearsPercentage),
        operatingExpenses: new Prisma.Decimal(kpis.operatingExpenses),
        maintenanceCosts: new Prisma.Decimal(kpis.maintenanceCosts),
        utilityCosts: new Prisma.Decimal(kpis.utilityCosts),
        netOperatingIncome: new Prisma.Decimal(kpis.netOperatingIncome),
        grossYield: new Prisma.Decimal(kpis.grossYield),
        netYield: new Prisma.Decimal(kpis.netYield),
        cashFlow: new Prisma.Decimal(kpis.cashFlow),
        marketValue: new Prisma.Decimal(kpis.marketValue),
        capRate: new Prisma.Decimal(kpis.capRate),
        healthStatus: kpis.healthStatus,
      },
    });
  }

  async createAllKPISnapshots() {
    const properties = await this.prisma.property.findMany({
      select: { id: true },
    });

    const results = [];
    for (const property of properties) {
      try {
        const snapshot = await this.createKPISnapshot(property.id);
        results.push({ propertyId: property.id, success: true, snapshot });
      } catch (error) {
        results.push({ propertyId: property.id, success: false, error: error.message });
      }
    }

    return results;
  }

  async getKPIHistory(propertyId: string, months: number = 12) {
    return this.prisma.propertyKPISnapshot.findMany({
      where: { propertyId },
      orderBy: { period: 'desc' },
      take: months,
    });
  }

  // --------------------------------------------------------------------------
  // FORECASTING
  // --------------------------------------------------------------------------

  async forecastScenarios(propertyId: string): Promise<ForecastScenario[]> {
    const kpis = await this.calculatePropertyKPIs(propertyId);

    const scenarios: ForecastScenario[] = [
      // Base case
      {
        name: 'Base Case',
        assumptions: { rentChangePercent: 0, vacancyRatePercent: kpis.vacancyRate, expenseChangePercent: 0 },
        projectedIncome: kpis.annualRentalIncome,
        projectedExpenses: (kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12,
        projectedNOI: kpis.netOperatingIncome * 12,
        projectedYield: kpis.netYield,
      },
      // Rent increase scenario
      {
        name: 'Rent Increase (5%)',
        assumptions: { rentChangePercent: 5, vacancyRatePercent: kpis.vacancyRate, expenseChangePercent: 3 },
        projectedIncome: kpis.annualRentalIncome * 1.05,
        projectedExpenses: (kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12 * 1.03,
        projectedNOI: (kpis.annualRentalIncome * 1.05) - ((kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12 * 1.03),
        projectedYield: 0, // Calculated below
      },
      // High vacancy scenario
      {
        name: 'High Vacancy (20%)',
        assumptions: { rentChangePercent: 0, vacancyRatePercent: 20, expenseChangePercent: 0 },
        projectedIncome: kpis.annualRentalIncome * 0.8,
        projectedExpenses: (kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12,
        projectedNOI: (kpis.annualRentalIncome * 0.8) - ((kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12),
        projectedYield: 0,
      },
      // Expense increase scenario
      {
        name: 'Expense Increase (10%)',
        assumptions: { rentChangePercent: 0, vacancyRatePercent: kpis.vacancyRate, expenseChangePercent: 10 },
        projectedIncome: kpis.annualRentalIncome,
        projectedExpenses: (kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12 * 1.1,
        projectedNOI: kpis.annualRentalIncome - ((kpis.operatingExpenses + kpis.maintenanceCosts + kpis.utilityCosts) * 12 * 1.1),
        projectedYield: 0,
      },
    ];

    // Calculate yields for all scenarios
    for (const scenario of scenarios) {
      if (kpis.marketValue > 0) {
        scenario.projectedYield = Math.round((scenario.projectedNOI / kpis.marketValue) * 100 * 100) / 100;
      }
    }

    return scenarios;
  }

  // --------------------------------------------------------------------------
  // DASHBOARD DATA
  // --------------------------------------------------------------------------

  async getDashboardData() {
    const [
      portfolioKPIs,
      problemProperties,
      expiringLeases,
      arrearsReport,
      recentPayments,
      openMaintenanceJobs,
    ] = await Promise.all([
      this.calculatePortfolioKPIs(),
      this.getProblemProperties(),
      this.getExpiringLeases(30),
      this.getArrearsReport(),
      this.getRecentPayments(10),
      this.getOpenMaintenanceJobs(),
    ]);

    return {
      portfolioKPIs,
      problemProperties,
      expiringLeases,
      arrearsReport,
      recentPayments,
      openMaintenanceJobs,
    };
  }

  private async getProblemProperties() {
    return this.prisma.property.findMany({
      where: {
        healthStatus: { in: [PropertyHealthStatus.UNDERPERFORMING, PropertyHealthStatus.NON_PERFORMING] },
      },
      include: {
        _count: {
          select: { leases: true },
        },
      },
      orderBy: { healthStatus: 'asc' },
    });
  }

  private async getExpiringLeases(days: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.lease.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date(), lte: futureDate },
      },
      include: {
        tenant: true,
        property: { select: { id: true, name: true, propertyCode: true } },
        unit: { select: { id: true, name: true, unitCode: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    });
  }

  private async getArrearsReport() {
    const arrearsSchedules = await this.prisma.rentSchedule.findMany({
      where: {
        status: { in: [RentPaymentStatus.OVERDUE, RentPaymentStatus.PARTIAL] },
        balance: { gt: 0 },
      },
      include: {
        lease: {
          include: {
            tenant: true,
            property: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    return arrearsSchedules.map(s => ({
      tenantName: s.lease.tenant.isCompany
        ? s.lease.tenant.companyName
        : `${s.lease.tenant.firstName} ${s.lease.tenant.lastName}`,
      propertyName: s.lease.property.name,
      amount: s.balance.toNumber(),
      dueDate: s.dueDate,
      daysPastDue: Math.floor((new Date().getTime() - s.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  private async getRecentPayments(limit: number) {
    return this.prisma.rentPayment.findMany({
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, companyName: true, isCompany: true },
        },
        lease: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });
  }

  private async getOpenMaintenanceJobs() {
    return this.prisma.propertyMaintenanceJob.findMany({
      where: {
        status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
      },
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        unit: { select: { id: true, name: true, unitCode: true } },
      },
      orderBy: [{ priority: 'desc' }, { reportedDate: 'asc' }],
      take: 10,
    });
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private calculateHealthStatus(metrics: {
    occupancyRate: number;
    collectionRate: number;
    arrearsPercentage: number;
    netYield: number;
  }): PropertyHealthStatus {
    const { occupancyRate, collectionRate, arrearsPercentage, netYield } = metrics;

    // Non-performing: Major issues
    if (occupancyRate < 50 || collectionRate < 50 || arrearsPercentage > 30 || netYield < 0) {
      return PropertyHealthStatus.NON_PERFORMING;
    }

    // Underperforming: Significant issues
    if (occupancyRate < 70 || collectionRate < 70 || arrearsPercentage > 20 || netYield < 3) {
      return PropertyHealthStatus.UNDERPERFORMING;
    }

    // At risk: Minor issues
    if (occupancyRate < 85 || collectionRate < 85 || arrearsPercentage > 10 || netYield < 5) {
      return PropertyHealthStatus.AT_RISK;
    }

    // Healthy: All metrics good
    return PropertyHealthStatus.HEALTHY;
  }
}
