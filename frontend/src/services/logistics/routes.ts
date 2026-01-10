import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type VehicleType = 'FLATBED' | 'TIPPER';

export interface Route {
  id: string;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  costPerKm?: number;
  timeHours?: number;
  warehouseId?: string;
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
  warehouse?: { id: string; name: string; locationCity?: string };
  creator?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { quotes: number };
}

export interface CreateRouteDto {
  fromCity: string;
  toCity: string;
  distanceKm: number;
  timeHours?: number;
  costPerKm?: number;
  warehouseId?: string;
  isActive?: boolean;
  notes?: string;
}

export interface SetRouteStationsDto {
  stations: Array<{ tollStationId: string; sortOrder: number }>;
}

export interface BulkImportResult {
  success: Array<{ row: number; fromCity: string; toCity: string }>;
  errors: Array<{ row: number; error: string }>;
}

export type RouteRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RouteRequest {
  id: string;
  fromCity?: string;
  toCity?: string;
  distanceKm?: number;
  timeHours?: number;
  warehouseId?: string;
  notes?: string;
  quoteId?: string;
  status: RouteRequestStatus;
  requestedByUserId: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  approvedRouteId?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string; locationCity?: string };
  requestedBy?: { id: string; firstName: string; lastName: string; email: string };
  reviewedBy?: { id: string; firstName: string; lastName: string; email: string };
  quote?: { id: string; quoteNumber: string };
}

export interface CreateRouteRequestDto {
  fromCity?: string;
  toCity?: string;
  distanceKm?: number;
  timeHours?: number;
  warehouseId?: string;
  notes?: string;
  quoteId?: string;
}

export interface ReviewRouteRequestDto {
  status: RouteRequestStatus;
  rejectionReason?: string;
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
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<BulkImportResult>>('/routes/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Route Request endpoints
  createRequest: (data: CreateRouteRequestDto) => api.post<ApiResponse<RouteRequest>>('/routes/requests', data),
  findAllRequests: (params?: { status?: RouteRequestStatus; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<RouteRequest>>>('/routes/requests', { params }),
  findOneRequest: (id: string) => api.get<ApiResponse<RouteRequest>>(`/routes/requests/${id}`),
  reviewRequest: (id: string, data: ReviewRouteRequestDto) => api.post<ApiResponse<{ request: RouteRequest; route?: Route }>>(`/routes/requests/${id}/review`, data),
};
