import { api, type ApiResponse, type PaginatedResponse } from '../api';
import type { VehicleType } from './routes';

export type { VehicleType };

export type TollPaymentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED';

export interface TollPayment {
  id: string;
  paidAt: string;
  vehicleType: VehicleType;
  routeId?: string;
  tollStationId?: string;
  amount: number;
  currency: string;
  receiptRef?: string;
  paidByUserId?: string;
  notes?: string;
  status: TollPaymentStatus;
  createdAt: string;
  updatedAt: string;
  route?: { id: string; fromCity: string; toCity: string };
  tollStation?: { id: string; name: string };
  paidBy?: { id: string; firstName: string; lastName: string; email: string };
  attachments?: Array<{ id: string; fileName: string; filePath: string; mimeType?: string }>;
}

export interface CreateTollPaymentDto {
  paidAt: string;
  vehicleType: VehicleType;
  routeId?: string;
  tollStationId?: string;
  amount: number;
  currency?: string;
  receiptRef?: string;
  notes?: string;
  status?: TollPaymentStatus;
}

export interface ReconcileTollPaymentsDto {
  startDate: string;
  endDate: string;
  routeId?: string;
  vehicleType?: VehicleType;
}

export interface ReconciliationResult {
  dateRange: { startDate: string; endDate: string };
  routeId?: string;
  vehicleType?: VehicleType;
  expectedTollsTotal: string;
  actualTollsTotal: string;
  variance: string;
  byStation: Array<{
    stationId: string;
    stationName: string;
    expected: string;
    actual: string;
    variance: string;
  }>;
}

export const tollPaymentsApi = {
  findAll: (
    page = 1,
    limit = 100,
    filters?: {
      startDate?: string;
      endDate?: string;
      routeId?: string;
      tollStationId?: string;
      vehicleType?: VehicleType;
      status?: TollPaymentStatus;
      paidByUserId?: string;
    },
  ) => api.get<ApiResponse<PaginatedResponse<TollPayment>>>('/toll-payments', { params: { page, limit, ...filters } }),
  findOne: (id: string) => api.get<ApiResponse<TollPayment>>(`/toll-payments/${id}`),
  create: (data: CreateTollPaymentDto) => api.post<ApiResponse<TollPayment>>('/toll-payments', data),
  update: (id: string, data: Partial<CreateTollPaymentDto>) => api.put<ApiResponse<TollPayment>>(`/toll-payments/${id}`, data),
  submit: (id: string) => api.post<ApiResponse<TollPayment>>(`/toll-payments/${id}/submit`),
  approve: (id: string) => api.post<ApiResponse<TollPayment>>(`/toll-payments/${id}/approve`),
  post: (id: string) => api.post<ApiResponse<TollPayment>>(`/toll-payments/${id}/post`),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/toll-payments/${id}`),
  reconcile: (data: ReconcileTollPaymentsDto) => api.post<ApiResponse<ReconciliationResult>>('/toll-payments/reconcile', data),
};
