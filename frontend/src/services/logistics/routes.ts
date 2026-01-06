import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type VehicleType = 'FLATBED' | 'TIPPER';

export interface Route {
  id: string;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  costPerKm?: number;
  timeHours?: number;
  isActive: boolean;
  notes?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  tolls?: Array<{ id: string; name: string; cost: number }>;
  tollStations?: Array<{
    id: string;
    sortOrder: number;
    isActive: boolean;
    tollStation: {
      id: string;
      name: string;
      cityOrArea?: string;
      code?: string;
      rates: Array<{
        id: string;
        vehicleType: VehicleType;
        amount: number;
        currency: string;
      }>;
    };
  }>;
  creator?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { quotes: number };
}

export interface CreateRouteDto {
  fromCity: string;
  toCity: string;
  distanceKm: number;
  timeHours?: number;
  costPerKm?: number;
  isActive?: boolean;
  notes?: string;
}

export interface SetRouteStationsDto {
  stations: Array<{ tollStationId: string; sortOrder: number }>;
}

export const routesApi = {
  findAll: (page = 1, limit = 100, filters?: { fromCity?: string; toCity?: string; isActive?: boolean; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Route>>>('/routes', { params: { page, limit, ...filters } }),
  findOne: (id: string) => api.get<ApiResponse<Route>>(`/routes/${id}`),
  create: (data: CreateRouteDto) => api.post<ApiResponse<Route>>('/routes', data),
  update: (id: string, data: Partial<CreateRouteDto>) => api.put<ApiResponse<Route>>(`/routes/${id}`, data),
  deactivate: (id: string) => api.post<ApiResponse<Route>>(`/routes/${id}/deactivate`),
  setStations: (id: string, data: SetRouteStationsDto) => api.post<ApiResponse<Route>>(`/routes/${id}/stations`, data),
  getStations: (id: string) => api.get<ApiResponse<Route['tollStations']>>(`/routes/${id}/stations`),
  getExpectedToll: (id: string, vehicleType: VehicleType) =>
    api.get<ApiResponse<{ routeId: string; vehicleType: VehicleType; total: string }>>(`/routes/${id}/expected-toll`, {
      params: { vehicleType },
    }),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/routes/${id}`),
};
