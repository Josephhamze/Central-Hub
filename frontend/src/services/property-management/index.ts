import { api } from '../api';

// ============================================================================
// ENUMS
// ============================================================================

export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED_USE = 'MIXED_USE',
  INDUSTRIAL = 'INDUSTRIAL',
  LAND = 'LAND',
}

export enum OwnershipType {
  OWNED = 'OWNED',
  LEASED = 'LEASED',
  MANAGED = 'MANAGED',
}

export enum PropertyStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  LISTED = 'LISTED',
  INACTIVE = 'INACTIVE',
}

export enum PropertyHealthStatus {
  HEALTHY = 'HEALTHY',
  AT_RISK = 'AT_RISK',
  UNDERPERFORMING = 'UNDERPERFORMING',
  NON_PERFORMING = 'NON_PERFORMING',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  LATE = 'LATE',
  VACATED = 'VACATED',
  BLACKLISTED = 'BLACKLISTED',
  PENDING = 'PENDING',
}

export enum LeaseType {
  FIXED = 'FIXED',
  MONTH_TO_MONTH = 'MONTH_TO_MONTH',
  YEARLY = 'YEARLY',
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTHER',
}

export enum RentPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  REFUNDED = 'REFUNDED',
}

export enum UtilityType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
  INTERNET = 'INTERNET',
  REFUSE = 'REFUSE',
  SECURITY = 'SECURITY',
  SEWAGE = 'SEWAGE',
  OTHER = 'OTHER',
}

export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  REPAIRS = 'REPAIRS',
  MUNICIPAL_TAXES = 'MUNICIPAL_TAXES',
  INSURANCE = 'INSURANCE',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  LEGAL = 'LEGAL',
  MARKETING = 'MARKETING',
  CLEANING = 'CLEANING',
  LANDSCAPING = 'LANDSCAPING',
  PEST_CONTROL = 'PEST_CONTROL',
  OTHER = 'OTHER',
}

export enum BillAllocation {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  SHARED = 'SHARED',
}

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface Property {
  id: string;
  propertyCode: string;
  name: string;
  propertyType: PropertyType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  unitCount: number;
  floorArea?: number;
  plotSize?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  description?: string;
  amenities?: string[];
  ownershipType: OwnershipType;
  status: PropertyStatus;
  healthStatus?: PropertyHealthStatus;
  purchaseDate?: string;
  purchaseValue?: number;
  currentMarketValue?: number;
  currentRentalValue?: number;
  currency: string;
  marketRentEstimate?: number;
  annualEscalationPct?: number;
  parentPropertyId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  units?: PropertyUnit[];
  leases?: Lease[];
  _count?: {
    units: number;
    leases: number;
    expenses: number;
    utilityBills: number;
    maintenanceJobs: number;
  };
}

export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitCode: string;
  name: string;
  floorNumber?: number;
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  hasBalcony: boolean;
  hasFurnished: boolean;
  description?: string;
  amenities?: string[];
  status: PropertyStatus;
  baseRentalValue?: number;
  currentRentalValue?: number;
  currency: string;
  electricityMeter?: string;
  waterMeter?: string;
  gasMeter?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  leases?: Lease[];
}

export interface Tenant {
  id: string;
  tenantCode: string;
  isCompany: boolean;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  idType?: string;
  idNumber?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: TenantStatus;
  currentBalance: number;
  notes?: string;
  blacklistReason?: string;
  createdAt: string;
  updatedAt: string;
  leases?: Lease[];
  _count?: {
    leases: number;
    rentPayments: number;
  };
}

export interface Lease {
  id: string;
  leaseCode: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  leaseType: LeaseType;
  startDate: string;
  endDate?: string;
  signedDate?: string;
  rentAmount: number;
  depositAmount: number;
  paymentFrequency: PaymentFrequency;
  paymentDueDay: number;
  gracePeriodDays: number;
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  currency: string;
  hasEscalation: boolean;
  escalationPct?: number;
  escalationDate?: string;
  nextEscalationDate?: string;
  preferredPaymentMethod?: PaymentMethod;
  utilitiesIncluded?: string[];
  contractDocumentUrl?: string;
  specialTerms?: string;
  notes?: string;
  isActive: boolean;
  terminatedDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  property?: Property;
  unit?: PropertyUnit;
  rentSchedules?: RentSchedule[];
  _count?: {
    rentPayments: number;
    rentSchedules: number;
  };
}

export interface RentSchedule {
  id: string;
  leaseId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  rentAmount: number;
  additionalCharges: number;
  totalDue: number;
  amountPaid: number;
  balance: number;
  status: RentPaymentStatus;
  lateFeeApplied: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lease?: Lease;
  payments?: RentPayment[];
}

export interface RentPayment {
  id: string;
  paymentCode: string;
  tenantId: string;
  leaseId: string;
  rentScheduleId?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  rentPortion: number;
  lateFeesPortion: number;
  depositPortion: number;
  otherPortion: number;
  status: RentPaymentStatus;
  isRefund: boolean;
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  lease?: Lease;
  rentSchedule?: RentSchedule;
}

export interface PropertyExpense {
  id: string;
  expenseCode: string;
  propertyId: string;
  category: ExpenseCategory;
  description: string;
  vendor?: string;
  expenseDate: string;
  periodStart?: string;
  periodEnd?: string;
  amount: number;
  currency: string;
  taxAmount?: number;
  totalAmount: number;
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  isRecurring: boolean;
  recurringFrequency?: PaymentFrequency;
  invoiceNumber?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
  budgetCategory?: string;
  isCapex: boolean;
  createdAt: string;
  updatedAt: string;
  property?: Property;
}

export interface UtilityBill {
  id: string;
  billCode: string;
  propertyId: string;
  unitId?: string;
  utilityType: UtilityType;
  provider?: string;
  accountNumber?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billDate: string;
  dueDate: string;
  previousReading?: number;
  currentReading?: number;
  consumption?: number;
  consumptionUnit?: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  allocation: BillAllocation;
  tenantSharePct?: number;
  status: BillStatus;
  paidDate?: string;
  paidAmount?: number;
  paymentReference?: string;
  billUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  unit?: PropertyUnit;
}

export interface MaintenanceJob {
  id: string;
  jobCode: string;
  propertyId: string;
  unitId?: string;
  workOrderId?: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: string;
  scheduledDate?: string;
  startedDate?: string;
  completedDate?: string;
  assignedTo?: string;
  contractorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  budgetCode?: string;
  affectsOccupancy: boolean;
  vacancyDaysImpact?: number;
  reportedByTenantId?: string;
  tenantAccessRequired: boolean;
  notes?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  unit?: PropertyUnit;
}

export interface PropertyKPIs {
  propertyId: string;
  propertyCode: string;
  propertyName: string;
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
  marketValue: number;
  capRate: number;
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

export interface DashboardData {
  portfolioKPIs: PortfolioKPIs;
  problemProperties: Property[];
  expiringLeases: Lease[];
  arrearsReport: ArrearsEntry[];
  recentPayments: RentPayment[];
  openMaintenanceJobs: MaintenanceJob[];
}

export interface ArrearsEntry {
  tenantName: string;
  propertyName: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
}

export interface RentRollEntry {
  leaseId: string;
  leaseCode: string;
  tenantName: string;
  propertyName: string;
  unitName?: string;
  rentAmount: number;
  startDate: string;
  endDate?: string;
  status: string;
  balance: number;
}

export interface TenantLedgerEntry {
  date: string;
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT' | 'LATE_FEE';
  description: string;
  amount: number;
  balance: number;
  reference?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API SERVICE
// ============================================================================

const BASE_URL = '/property-management';

export const propertyManagementService = {
  // Properties
  getProperties: async (params?: Record<string, any>): Promise<PaginatedResponse<Property>> => {
    const response = await api.get(`${BASE_URL}/properties`, { params });
    return response.data;
  },

  getProperty: async (id: string): Promise<Property> => {
    const response = await api.get(`${BASE_URL}/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: Partial<Property>): Promise<Property> => {
    const response = await api.post(`${BASE_URL}/properties`, data);
    return response.data;
  },

  updateProperty: async (id: string, data: Partial<Property>): Promise<Property> => {
    const response = await api.put(`${BASE_URL}/properties/${id}`, data);
    return response.data;
  },

  deleteProperty: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/properties/${id}`);
  },

  getPropertySummary: async (): Promise<any> => {
    const response = await api.get(`${BASE_URL}/properties/summary`);
    return response.data;
  },

  getVacantProperties: async (): Promise<Property[]> => {
    const response = await api.get(`${BASE_URL}/properties/vacant`);
    return response.data;
  },

  // Property Units
  getPropertyUnits: async (propertyId: string, params?: Record<string, any>): Promise<PaginatedResponse<PropertyUnit>> => {
    const response = await api.get(`${BASE_URL}/properties/${propertyId}/units`, { params });
    return response.data;
  },

  getUnit: async (id: string): Promise<PropertyUnit> => {
    const response = await api.get(`${BASE_URL}/units/${id}`);
    return response.data;
  },

  createUnit: async (data: Partial<PropertyUnit>): Promise<PropertyUnit> => {
    const response = await api.post(`${BASE_URL}/units`, data);
    return response.data;
  },

  updateUnit: async (id: string, data: Partial<PropertyUnit>): Promise<PropertyUnit> => {
    const response = await api.put(`${BASE_URL}/units/${id}`, data);
    return response.data;
  },

  deleteUnit: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/units/${id}`);
  },

  getVacantUnits: async (): Promise<PropertyUnit[]> => {
    const response = await api.get(`${BASE_URL}/units/vacant`);
    return response.data;
  },

  // Tenants
  getTenants: async (params?: Record<string, any>): Promise<PaginatedResponse<Tenant>> => {
    const response = await api.get(`${BASE_URL}/tenants`, { params });
    return response.data;
  },

  getTenant: async (id: string): Promise<Tenant> => {
    const response = await api.get(`${BASE_URL}/tenants/${id}`);
    return response.data;
  },

  createTenant: async (data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.post(`${BASE_URL}/tenants`, data);
    return response.data;
  },

  updateTenant: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.put(`${BASE_URL}/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/tenants/${id}`);
  },

  getTenantLedger: async (tenantId: string, params?: { startDate?: string; endDate?: string }): Promise<TenantLedgerEntry[]> => {
    const response = await api.get(`${BASE_URL}/tenants/${tenantId}/ledger`, { params });
    return response.data;
  },

  getTenantStatistics: async (): Promise<any> => {
    const response = await api.get(`${BASE_URL}/tenants/statistics`);
    return response.data;
  },

  getTenantsInArrears: async (): Promise<Tenant[]> => {
    const response = await api.get(`${BASE_URL}/tenants/arrears`);
    return response.data;
  },

  // Leases
  getLeases: async (params?: Record<string, any>): Promise<PaginatedResponse<Lease>> => {
    const response = await api.get(`${BASE_URL}/leases`, { params });
    return response.data;
  },

  getLease: async (id: string): Promise<Lease> => {
    const response = await api.get(`${BASE_URL}/leases/${id}`);
    return response.data;
  },

  createLease: async (data: Partial<Lease>): Promise<Lease> => {
    const response = await api.post(`${BASE_URL}/leases`, data);
    return response.data;
  },

  updateLease: async (id: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put(`${BASE_URL}/leases/${id}`, data);
    return response.data;
  },

  terminateLease: async (id: string, reason: string): Promise<Lease> => {
    const response = await api.post(`${BASE_URL}/leases/${id}/terminate`, { reason });
    return response.data;
  },

  renewLease: async (id: string, newEndDate: string, newRentAmount?: number): Promise<Lease> => {
    const response = await api.post(`${BASE_URL}/leases/${id}/renew`, { newEndDate, newRentAmount });
    return response.data;
  },

  getLeaseStatistics: async (): Promise<any> => {
    const response = await api.get(`${BASE_URL}/leases/statistics`);
    return response.data;
  },

  getExpiringLeases: async (days?: number): Promise<Lease[]> => {
    const response = await api.get(`${BASE_URL}/leases/expiring`, { params: { days } });
    return response.data;
  },

  getRentRoll: async (propertyId?: string): Promise<RentRollEntry[]> => {
    const response = await api.get(`${BASE_URL}/leases/rent-roll`, { params: { propertyId } });
    return response.data;
  },

  getRentSchedules: async (leaseId: string, params?: Record<string, any>): Promise<PaginatedResponse<RentSchedule>> => {
    const response = await api.get(`${BASE_URL}/leases/${leaseId}/schedules`, { params });
    return response.data;
  },

  // Payments
  getPayments: async (params?: Record<string, any>): Promise<PaginatedResponse<RentPayment>> => {
    const response = await api.get(`${BASE_URL}/payments`, { params });
    return response.data;
  },

  getPayment: async (id: string): Promise<RentPayment> => {
    const response = await api.get(`${BASE_URL}/payments/${id}`);
    return response.data;
  },

  createPayment: async (data: Partial<RentPayment>): Promise<RentPayment> => {
    const response = await api.post(`${BASE_URL}/payments`, data);
    return response.data;
  },

  refundPayment: async (id: string, reason: string): Promise<RentPayment> => {
    const response = await api.post(`${BASE_URL}/payments/${id}/refund`, { reason });
    return response.data;
  },

  getCollectionStatistics: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get(`${BASE_URL}/payments/statistics`, { params });
    return response.data;
  },

  getArrearsReport: async (): Promise<ArrearsEntry[]> => {
    const response = await api.get(`${BASE_URL}/payments/arrears`);
    return response.data;
  },

  applyLateFees: async (): Promise<number> => {
    const response = await api.post(`${BASE_URL}/payments/apply-late-fees`);
    return response.data;
  },

  // Expenses
  getExpenses: async (params?: Record<string, any>): Promise<PaginatedResponse<PropertyExpense>> => {
    const response = await api.get(`${BASE_URL}/expenses`, { params });
    return response.data;
  },

  getExpense: async (id: string): Promise<PropertyExpense> => {
    const response = await api.get(`${BASE_URL}/expenses/${id}`);
    return response.data;
  },

  createExpense: async (data: Partial<PropertyExpense>): Promise<PropertyExpense> => {
    const response = await api.post(`${BASE_URL}/expenses`, data);
    return response.data;
  },

  updateExpense: async (id: string, data: Partial<PropertyExpense>): Promise<PropertyExpense> => {
    const response = await api.put(`${BASE_URL}/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/expenses/${id}`);
  },

  markExpenseAsPaid: async (id: string, paymentMethod: PaymentMethod, paymentReference?: string): Promise<PropertyExpense> => {
    const response = await api.patch(`${BASE_URL}/expenses/${id}/pay`, { paymentMethod, paymentReference });
    return response.data;
  },

  getExpenseSummary: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get(`${BASE_URL}/expenses/summary`, { params });
    return response.data;
  },

  getExpenseForecast: async (propertyId: string, months?: number): Promise<any> => {
    const response = await api.get(`${BASE_URL}/expenses/forecast/${propertyId}`, { params: { months } });
    return response.data;
  },

  // Utilities
  getUtilityBills: async (params?: Record<string, any>): Promise<PaginatedResponse<UtilityBill>> => {
    const response = await api.get(`${BASE_URL}/utilities`, { params });
    return response.data;
  },

  getUtilityBill: async (id: string): Promise<UtilityBill> => {
    const response = await api.get(`${BASE_URL}/utilities/${id}`);
    return response.data;
  },

  createUtilityBill: async (data: Partial<UtilityBill>): Promise<UtilityBill> => {
    const response = await api.post(`${BASE_URL}/utilities`, data);
    return response.data;
  },

  updateUtilityBill: async (id: string, data: Partial<UtilityBill>): Promise<UtilityBill> => {
    const response = await api.put(`${BASE_URL}/utilities/${id}`, data);
    return response.data;
  },

  deleteUtilityBill: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/utilities/${id}`);
  },

  markUtilityBillAsPaid: async (id: string, paidAmount: number, paymentReference?: string): Promise<UtilityBill> => {
    const response = await api.patch(`${BASE_URL}/utilities/${id}/pay`, { paidAmount, paymentReference });
    return response.data;
  },

  getUtilitySummary: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get(`${BASE_URL}/utilities/summary`, { params });
    return response.data;
  },

  getConsumptionTrend: async (propertyId: string, utilityType: UtilityType, months?: number): Promise<any> => {
    const response = await api.get(`${BASE_URL}/utilities/consumption/${propertyId}`, { params: { utilityType, months } });
    return response.data;
  },

  // Maintenance
  getMaintenanceJobs: async (params?: Record<string, any>): Promise<PaginatedResponse<MaintenanceJob>> => {
    const response = await api.get(`${BASE_URL}/maintenance`, { params });
    return response.data;
  },

  getMaintenanceJob: async (id: string): Promise<MaintenanceJob> => {
    const response = await api.get(`${BASE_URL}/maintenance/${id}`);
    return response.data;
  },

  createMaintenanceJob: async (data: Partial<MaintenanceJob>): Promise<MaintenanceJob> => {
    const response = await api.post(`${BASE_URL}/maintenance`, data);
    return response.data;
  },

  updateMaintenanceJob: async (id: string, data: Partial<MaintenanceJob>): Promise<MaintenanceJob> => {
    const response = await api.put(`${BASE_URL}/maintenance/${id}`, data);
    return response.data;
  },

  deleteMaintenanceJob: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/maintenance/${id}`);
  },

  scheduleMaintenanceJob: async (id: string, scheduledDate: string, assignedTo: string): Promise<MaintenanceJob> => {
    const response = await api.post(`${BASE_URL}/maintenance/${id}/schedule`, { scheduledDate, assignedTo });
    return response.data;
  },

  startMaintenanceJob: async (id: string): Promise<MaintenanceJob> => {
    const response = await api.post(`${BASE_URL}/maintenance/${id}/start`);
    return response.data;
  },

  completeMaintenanceJob: async (id: string, actualCost: number, resolutionNotes?: string): Promise<MaintenanceJob> => {
    const response = await api.post(`${BASE_URL}/maintenance/${id}/complete`, { actualCost, resolutionNotes });
    return response.data;
  },

  cancelMaintenanceJob: async (id: string, reason: string): Promise<MaintenanceJob> => {
    const response = await api.post(`${BASE_URL}/maintenance/${id}/cancel`, { reason });
    return response.data;
  },

  getMaintenanceSummary: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get(`${BASE_URL}/maintenance/summary`, { params });
    return response.data;
  },

  getOpenMaintenanceJobs: async (propertyId?: string): Promise<MaintenanceJob[]> => {
    const response = await api.get(`${BASE_URL}/maintenance/open`, { params: { propertyId } });
    return response.data;
  },

  getUrgentMaintenanceJobs: async (): Promise<MaintenanceJob[]> => {
    const response = await api.get(`${BASE_URL}/maintenance/urgent`);
    return response.data;
  },

  // KPIs & Dashboard
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get(`${BASE_URL}/kpi/dashboard`);
    return response.data;
  },

  getPortfolioKPIs: async (params?: { startDate?: string; endDate?: string }): Promise<PortfolioKPIs> => {
    const response = await api.get(`${BASE_URL}/kpi/portfolio`, { params });
    return response.data;
  },

  getPropertyKPIs: async (propertyId: string, params?: { startDate?: string; endDate?: string }): Promise<PropertyKPIs> => {
    const response = await api.get(`${BASE_URL}/kpi/property/${propertyId}`, { params });
    return response.data;
  },

  getPropertyKPIHistory: async (propertyId: string, months?: number): Promise<any[]> => {
    const response = await api.get(`${BASE_URL}/kpi/property/${propertyId}/history`, { params: { months } });
    return response.data;
  },

  getPropertyForecast: async (propertyId: string): Promise<any[]> => {
    const response = await api.get(`${BASE_URL}/kpi/property/${propertyId}/forecast`);
    return response.data;
  },

  createKPISnapshot: async (propertyId: string): Promise<any> => {
    const response = await api.post(`${BASE_URL}/kpi/snapshot/${propertyId}`);
    return response.data;
  },

  createAllKPISnapshots: async (): Promise<any> => {
    const response = await api.post(`${BASE_URL}/kpi/snapshot-all`);
    return response.data;
  },
};

export default propertyManagementService;
