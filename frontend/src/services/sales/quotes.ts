import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';
export type DeliveryMethod = 'DELIVERED' | 'COLLECTED';
export type QuoteStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'WON' | 'LOST';

export interface QuoteItem {
  id: string;
  stockItemId: string;
  nameSnapshot: string;
  uomSnapshot: string;
  qty: number;
  unitPrice: number;
  discountPercentage: number;
  lineTotal: number;
  stockItem?: { id: string; name: string; sku?: string };
}

export interface Quote {
  id: string;
  quoteNumber: string;
  companyId: string;
  projectId: string;
  customerId: string;
  contactId?: string;
  warehouseId?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
  routeId?: string;
  distanceKmSnapshot?: number;
  costPerKmSnapshot?: number;
  tollTotalSnapshot?: number;
  subtotal: number;
  discountPercentage: number;
  transportTotal: number;
  grandTotal: number;
  validityDays: number;
  paymentTerms?: 'CASH_ON_DELIVERY' | 'DAYS_15' | 'DAYS_30';
  deliveryStartDate?: string;
  serviceEndDate?: string;
  loadsPerDay?: number;
  truckType?: 'TIPPER_42T' | 'CANTER';
  status: QuoteStatus;
  salesRepUserId: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  lossReasonCategory?: 'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER';
  outcomeReasonNotes?: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  project?: { id: string; name: string };
  customer?: { id: string; type: CustomerType; companyName?: string; firstName?: string; lastName?: string };
  contact?: { id: string; name: string };
  salesRep?: { id: string; firstName: string; lastName: string; email: string };
  items?: QuoteItem[];
  route?: { id: string; fromCity: string; toCity: string; tolls: Array<{ id: string; name: string; cost: number }> };
  approvals?: Array<{ id: string; action: string; actor: { id: string; firstName: string; lastName: string }; notes?: string; createdAt: string }>;
}

export interface CreateQuoteItemDto {
  stockItemId: string;
  qty: number;
  unitPrice: number;
  discountPercentage?: number;
}

export interface CreateQuoteDto {
  companyId: string;
  projectId: string;
  customerId: string;
  contactId?: string;
  warehouseId?: string;
  deliveryMethod: DeliveryMethod;
  routeId?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
  validityDays?: number;
  paymentTerms?: 'CASH_ON_DELIVERY' | 'DAYS_15' | 'DAYS_30';
  deliveryStartDate?: string;
  serviceEndDate?: string;
  loadsPerDay?: number;
  truckType?: 'TIPPER_42T' | 'CANTER';
  items: CreateQuoteItemDto[];
}

export interface SalesKPIs {
  totalQuotes: number;
  wins: number;
  losses: number;
  winRate: number;
  avgQuoteValue: number;
  pipelineValue: number;
  wonValue: number;
  avgApprovalTimeHours: number;
}

export const quotesApi = {
  findAll: (params?: { status?: QuoteStatus; companyId?: string; projectId?: string; salesRepUserId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Quote>>>('/quotes', { params }),
  findOne: (id: string) => api.get<ApiResponse<Quote>>(`/quotes/${id}`),
  create: (data: CreateQuoteDto) => api.post<ApiResponse<Quote>>('/quotes', data),
  update: (id: string, data: Partial<CreateQuoteDto>) => api.put<ApiResponse<Quote>>(`/quotes/${id}`, data),
  submit: (id: string, notes?: string) => api.post<ApiResponse<Quote>>(`/quotes/${id}/submit`, { notes }),
  approve: (id: string, notes?: string) => api.post<ApiResponse<Quote>>(`/quotes/${id}/approve`, { notes }),
  reject: (id: string, reason: string) => api.post<ApiResponse<Quote>>(`/quotes/${id}/reject`, { reason }),
  withdraw: (id: string) => api.post<ApiResponse<Quote>>(`/quotes/${id}/withdraw`),
  markOutcome: (id: string, outcome: 'WON' | 'LOST', lossReasonCategory?: 'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER', reasonNotes?: string) =>
    api.post<ApiResponse<Quote>>(`/quotes/${id}/outcome?outcome=${outcome}`, { lossReasonCategory, reasonNotes }),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/quotes/${id}`),
  getKPIs: (params?: { companyId?: string; projectId?: string; salesRepUserId?: string; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<SalesKPIs>>('/quotes/kpis', { params }),
};
