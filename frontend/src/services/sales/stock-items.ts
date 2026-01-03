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
  project?: { id: string; name: string; companyId?: string; company?: { id: string; name: string } };
  warehouse?: { id: string; name: string };
}

export interface CreateStockItemDto {
  companyId?: string; // Optional, used for UI filtering but not sent to API
  projectId: string; // Required
  warehouseId: string; // Required
  sku?: string; // Optional, auto-generated if not provided
  name: string;
  description?: string; // Optional, not stored in DB but accepted to avoid validation errors
  uom: string;
  minUnitPrice: number;
  defaultUnitPrice: number;
  minOrderQty: number;
  truckloadOnly?: boolean;
  isActive?: boolean;
}

export const stockItemsApi = {
  findAll: (companyId?: string, projectId?: string, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<StockItem>>>('/stock-items', { params: { companyId, projectId, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<StockItem>>(`/stock-items/${id}`),
  create: (data: CreateStockItemDto) => api.post<ApiResponse<StockItem>>('/stock-items', data),
  update: (id: string, data: Partial<CreateStockItemDto>) => api.put<ApiResponse<StockItem>>(`/stock-items/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/stock-items/${id}`),
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ success: Array<{ row: number; name: string; sku: string }>; errors: Array<{ row: number; error: string }> }>>('/stock-items/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
