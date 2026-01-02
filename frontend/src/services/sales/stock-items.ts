import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface StockItem {
  id: string;
  companyId: string;
  projectId?: string;
  warehouseId?: string;
  sku: string;
  name: string;
  description?: string;
  uom: string;
  minUnitPrice: number;
  defaultUnitPrice: number;
  minOrderQty: number;
  truckloadOnly: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  project?: { id: string; name: string };
  warehouse?: { id: string; name: string };
}

export interface CreateStockItemDto {
  companyId: string;
  projectId?: string;
  warehouseId?: string;
  sku: string;
  name: string;
  description?: string;
  uom: string;
  minUnitPrice: number;
  defaultUnitPrice: number;
  minOrderQty: number;
  truckloadOnly: boolean;
  isActive?: boolean;
}

export const stockItemsApi = {
  findAll: (companyId?: string, projectId?: string, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<StockItem>>>('/stock-items', { params: { companyId, projectId, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<StockItem>>(`/stock-items/${id}`),
  create: (data: CreateStockItemDto) => api.post<ApiResponse<StockItem>>('/stock-items', data),
  update: (id: string, data: Partial<CreateStockItemDto>) => api.put<ApiResponse<StockItem>>(`/stock-items/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/stock-items/${id}`),
};
