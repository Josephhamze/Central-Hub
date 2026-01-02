import { api } from '../api';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';
  location?: string;
  projectId?: string;
  warehouseId?: string;
  assignedTo?: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedLifeYears?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  warehouse?: { id: string; name: string };
  _count?: {
    workOrders: number;
    maintenanceSchedules: number;
  };
}

export interface CreateAssetDto {
  assetTag: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';
  location?: string;
  projectId?: string;
  warehouseId?: string;
  assignedTo?: string;
  criticality?: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedLifeYears?: number;
  notes?: string;
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {}

export interface AssetOverview {
  totalAssets: number;
  operationalAssets: number;
  maintenanceAssets: number;
  brokenAssets: number;
  overdueMaintenance: number;
  openWorkOrders: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const assetsApi = {
  getOverview: async (): Promise<AssetOverview> => {
    const res = await api.get('/assets/overview');
    return res.data.data;
  },

  findAll: async (page = 1, limit = 20, search?: string, status?: string): Promise<PaginatedResponse<Asset>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await api.get(`/assets?${params.toString()}`);
    return res.data.data;
  },

  findOne: async (id: string): Promise<Asset> => {
    const res = await api.get(`/assets/${id}`);
    return res.data.data;
  },

  getHistory: async (id: string, page = 1, limit = 50): Promise<PaginatedResponse<any>> => {
    const res = await api.get(`/assets/${id}/history?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  create: async (dto: CreateAssetDto): Promise<Asset> => {
    const res = await api.post('/assets', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateAssetDto): Promise<Asset> => {
    const res = await api.put(`/assets/${id}`, dto);
    return res.data.data;
  },

  retire: async (id: string): Promise<Asset> => {
    const res = await api.patch(`/assets/${id}/retire`);
    return res.data.data;
  },
};
