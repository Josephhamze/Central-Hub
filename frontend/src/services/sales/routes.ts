import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface Toll {
  id: string;
  routeId: string;
  name: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  costPerKm: number;
  createdAt: string;
  updatedAt: string;
  tolls?: Toll[];
}

export interface CreateRouteDto {
  fromCity: string;
  toCity: string;
  distanceKm: number;
  costPerKm: number;
}

export interface CreateTollDto {
  routeId: string;
  name: string;
  cost: number;
}

export const routesApi = {
  findAll: (page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<Route>>>('/routes', { params: { page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<Route>>(`/routes/${id}`),
  create: (data: CreateRouteDto) => api.post<ApiResponse<Route>>('/routes', data),
  update: (id: string, data: Partial<CreateRouteDto>) => api.put<ApiResponse<Route>>(`/routes/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/routes/${id}`),
  addToll: (data: CreateTollDto) => api.post<ApiResponse<Toll>>('/routes/tolls', data),
  removeToll: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/routes/tolls/${id}`),
};
