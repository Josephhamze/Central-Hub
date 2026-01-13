import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface StockLevel {
  id: string;
  date: string;
  productTypeId: string;
  stockpileLocationId: string;
  openingStock: number;
  produced: number;
  sold: number;
  adjustments: number;
  adjustmentReason?: string;
  closingStock: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  productType?: { id: string; name: string };
  stockpileLocation?: { id: string; name: string };
  createdBy?: { id: string; firstName: string; lastName: string };
}

export const stockLevelsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    productTypeId?: string;
    stockpileLocationId?: string;
  }) =>
    api.get<ApiResponse<PaginatedResponse<StockLevel>>>('/quarry-production/stock-levels', { params }),

  getCurrent: (params?: { productTypeId?: string; stockpileLocationId?: string }) =>
    api.get<ApiResponse<StockLevel[]>>('/quarry-production/stock-levels/current', { params }),

  get: (id: string) =>
    api.get<ApiResponse<StockLevel>>(`/quarry-production/stock-levels/${id}`),

  createOrUpdate: (data: {
    date: string;
    productTypeId: string;
    stockpileLocationId: string;
    openingStock?: number;
    sold?: number;
    adjustments?: number;
    adjustmentReason?: string;
  }) =>
    api.post<ApiResponse<StockLevel>>('/quarry-production/stock-levels', data),

  update: (id: string, data: Partial<{
    date: string;
    productTypeId: string;
    stockpileLocationId: string;
    openingStock?: number;
    sold?: number;
    adjustments?: number;
    adjustmentReason?: string;
  }>) =>
    api.patch<ApiResponse<StockLevel>>(`/quarry-production/stock-levels/${id}`, data),

  adjust: (id: string, data: { adjustments: number; adjustmentReason: string }) =>
    api.post<ApiResponse<StockLevel>>(`/quarry-production/stock-levels/${id}/adjust`, data),

  recalculate: (data: { date: string; productTypeId: string; stockpileLocationId: string }) =>
    api.post<ApiResponse<StockLevel>>('/quarry-production/stock-levels/recalculate', data),
};
