import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface Warehouse {
  id: string;
  companyId: string;
  projectId?: string;
  name: string;
  locationCity?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  project?: { id: string; name: string };
}

export interface CreateWarehouseDto {
  companyId: string;
  projectId?: string;
  name: string;
  locationCity?: string;
  isActive?: boolean;
}

export const warehousesApi = {
  findAll: (companyId?: string, projectId?: string, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<Warehouse>>>('/warehouses', { params: { companyId, projectId, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<Warehouse>>(`/warehouses/${id}`),
  create: (data: CreateWarehouseDto) => api.post<ApiResponse<Warehouse>>('/warehouses', data),
  update: (id: string, data: Partial<CreateWarehouseDto>) => api.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/warehouses/${id}`),
};
