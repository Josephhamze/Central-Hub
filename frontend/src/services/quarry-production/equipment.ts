import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type EquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
export type CrusherType = 'PRIMARY_JAW' | 'SECONDARY_CONE' | 'TERTIARY_VSI' | 'SCREEN';

export interface Excavator {
  id: string;
  name: string;
  bucketCapacity: number;
  status: EquipmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { entries: number };
}

export interface Truck {
  id: string;
  name: string;
  loadCapacity: number;
  status: EquipmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { entries: number };
}

export interface Crusher {
  id: string;
  name: string;
  type: CrusherType;
  ratedCapacity: number;
  status: EquipmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { feedEntries: number; outputEntries: number };
}

export interface CreateExcavatorDto {
  name: string;
  bucketCapacity: number;
  status?: EquipmentStatus;
  notes?: string;
}

export interface CreateTruckDto {
  name: string;
  loadCapacity: number;
  status?: EquipmentStatus;
  notes?: string;
}

export interface CreateCrusherDto {
  name: string;
  type: CrusherType;
  ratedCapacity: number;
  status?: EquipmentStatus;
  notes?: string;
}

// Excavators
export const excavatorsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: EquipmentStatus }) =>
    api.get<ApiResponse<PaginatedResponse<Excavator>>>('/quarry-production/excavators', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Excavator>>(`/quarry-production/excavators/${id}`),

  create: (data: CreateExcavatorDto) =>
    api.post<ApiResponse<Excavator>>('/quarry-production/excavators', data),

  update: (id: string, data: Partial<CreateExcavatorDto>) =>
    api.patch<ApiResponse<Excavator>>(`/quarry-production/excavators/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/excavators/${id}`),
};

// Trucks
export const trucksApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: EquipmentStatus }) =>
    api.get<ApiResponse<PaginatedResponse<Truck>>>('/quarry-production/trucks', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Truck>>(`/quarry-production/trucks/${id}`),

  create: (data: CreateTruckDto) =>
    api.post<ApiResponse<Truck>>('/quarry-production/trucks', data),

  update: (id: string, data: Partial<CreateTruckDto>) =>
    api.patch<ApiResponse<Truck>>(`/quarry-production/trucks/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/trucks/${id}`),
};

// Crushers
export const crushersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: EquipmentStatus }) =>
    api.get<ApiResponse<PaginatedResponse<Crusher>>>('/quarry-production/crushers', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Crusher>>(`/quarry-production/crushers/${id}`),

  create: (data: CreateCrusherDto) =>
    api.post<ApiResponse<Crusher>>('/quarry-production/crushers', data),

  update: (id: string, data: Partial<CreateCrusherDto>) =>
    api.patch<ApiResponse<Crusher>>(`/quarry-production/crushers/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/crushers/${id}`),
};
