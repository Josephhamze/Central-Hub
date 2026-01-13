import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface PitLocation {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialType {
  id: string;
  name: string;
  density: number; // tonnes per cubic meter
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockpileLocation {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pit Locations
export const pitLocationsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<PitLocation>>>('/quarry-production/pit-locations', { params }),

  get: (id: string) =>
    api.get<ApiResponse<PitLocation>>(`/quarry-production/pit-locations/${id}`),

  create: (data: { name: string; isActive?: boolean }) =>
    api.post<ApiResponse<PitLocation>>('/quarry-production/pit-locations', data),

  update: (id: string, data: Partial<{ name: string; isActive?: boolean }>) =>
    api.patch<ApiResponse<PitLocation>>(`/quarry-production/pit-locations/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/pit-locations/${id}`),
};

// Material Types
export const materialTypesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<MaterialType>>>('/quarry-production/material-types', { params }),

  get: (id: string) =>
    api.get<ApiResponse<MaterialType>>(`/quarry-production/material-types/${id}`),

  create: (data: { name: string; density: number; isActive?: boolean }) =>
    api.post<ApiResponse<MaterialType>>('/quarry-production/material-types', data),

  update: (id: string, data: Partial<{ name: string; density: number; isActive?: boolean }>) =>
    api.patch<ApiResponse<MaterialType>>(`/quarry-production/material-types/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/material-types/${id}`),
};

// Product Types
export const productTypesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<ProductType>>>('/quarry-production/product-types', { params }),

  get: (id: string) =>
    api.get<ApiResponse<ProductType>>(`/quarry-production/product-types/${id}`),

  create: (data: { name: string; isActive?: boolean }) =>
    api.post<ApiResponse<ProductType>>('/quarry-production/product-types', data),

  update: (id: string, data: Partial<{ name: string; isActive?: boolean }>) =>
    api.patch<ApiResponse<ProductType>>(`/quarry-production/product-types/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/product-types/${id}`),
};

// Stockpile Locations
export const stockpileLocationsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<StockpileLocation>>>('/quarry-production/stockpile-locations', { params }),

  get: (id: string) =>
    api.get<ApiResponse<StockpileLocation>>(`/quarry-production/stockpile-locations/${id}`),

  create: (data: { name: string; isActive?: boolean }) =>
    api.post<ApiResponse<StockpileLocation>>('/quarry-production/stockpile-locations', data),

  update: (id: string, data: Partial<{ name: string; isActive?: boolean }>) =>
    api.patch<ApiResponse<StockpileLocation>>(`/quarry-production/stockpile-locations/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/stockpile-locations/${id}`),
};
