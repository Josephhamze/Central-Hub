import { api, type ApiResponse, type PaginatedResponse } from '../api';
import type { VehicleType } from './routes';

export interface TollStation {
  id: string;
  name: string;
  cityOrArea?: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rates?: Array<TollRate>;
  _count?: { routeStations: number; payments: number };
}

export interface TollRate {
  id: string;
  tollStationId: string;
  vehicleType: VehicleType;
  amount: number;
  currency: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTollStationDto {
  name: string;
  cityOrArea?: string;
  code?: string;
  isActive?: boolean;
}

export interface CreateTollRateDto {
  vehicleType: VehicleType;
  amount: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export const tollStationsApi = {
  findAll: (page = 1, limit = 100, filters?: { isActive?: boolean; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<TollStation>>>('/toll-stations', { params: { page, limit, ...filters } }),
  findOne: (id: string) => api.get<ApiResponse<TollStation>>(`/toll-stations/${id}`),
  create: (data: CreateTollStationDto) => api.post<ApiResponse<TollStation>>('/toll-stations', data),
  update: (id: string, data: Partial<CreateTollStationDto>) => api.put<ApiResponse<TollStation>>(`/toll-stations/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/toll-stations/${id}`),
  getRates: (id: string, vehicleType?: string) =>
    api.get<ApiResponse<TollRate[]>>(`/toll-stations/${id}/rates`, { params: { vehicleType } }),
  createRate: (id: string, data: CreateTollRateDto) => api.post<ApiResponse<TollRate>>(`/toll-stations/${id}/rates`, data),
  updateRate: (id: string, rateId: string, data: Partial<CreateTollRateDto>) =>
    api.put<ApiResponse<TollRate>>(`/toll-stations/${id}/rates/${rateId}`, data),
  removeRate: (id: string, rateId: string) => api.delete<ApiResponse<{ message: string }>>(`/toll-stations/${id}/rates/${rateId}`),
};
