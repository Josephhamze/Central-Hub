import { api } from '../api';

export type IndexType = 'HOURS' | 'KILOMETERS' | 'MILES' | 'CYCLES' | 'UNITS' | 'OTHER';
export type AssetLifecycleStatus = 'NEW' | 'IN_SERVICE' | 'UNDER_MAINTENANCE' | 'IDLE' | 'RETIRED' | 'DISPOSED';
export type AssetStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';
export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  type?: string;
  family?: string;
  manufacturer?: string;
  model?: string;
  yearModel?: number;
  color?: string;
  companyId?: string;
  projectId?: string;
  companyCode?: string;
  countryOfRegistration?: string;
  currentLocation?: string;
  parentAssetId?: string;
  serialNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  registrationNumber?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currency?: string;
  brandNewValue?: number;
  currentMarketValue?: number;
  residualValue?: number;
  purchaseOrder?: string;
  glAccount?: string;
  installDate?: string;
  endOfLifeDate?: string;
  disposalDate?: string;
  assetLifecycleStatus?: AssetLifecycleStatus;
  indexType?: IndexType;
  currentIndex?: number;
  indexAtPurchase?: number;
  lastIndexDate?: string;
  status: AssetStatus;
  statusSince?: string;
  availabilityPercent?: number;
  lastOperator?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceBudget?: number;
  // Legacy fields
  acquisitionDate?: string;
  acquisitionCost?: number;
  currentValue?: number;
  location?: string;
  warehouseId?: string;
  assignedTo?: string;
  criticality: AssetCriticality;
  expectedLifeYears?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  project?: { id: string; name: string };
  warehouse?: { id: string; name: string };
  parentAsset?: { id: string; name: string; assetTag: string };
  _count?: {
    workOrders: number;
    maintenanceSchedules: number;
  };
}

export interface CreateAssetDto {
  // ASSET IDENTITY
  assetName: string;
  category: string;
  type: string;
  family?: string;
  manufacturer: string;
  model: string;
  yearModel?: number;
  color?: string;
  // ALLOCATION
  companyId: string;
  projectId: string;
  companyCode: string;
  countryOfRegistration?: string;
  currentLocation?: string;
  parentAssetId?: string;
  // IDENTIFICATION
  serialNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  registrationNumber?: string;
  // FINANCIAL INFORMATION
  purchaseDate: string;
  purchaseValue: number;
  currency: string;
  brandNewValue?: number;
  currentMarketValue?: number;
  residualValue?: number;
  purchaseOrder?: string;
  glAccount?: string;
  // LIFECYCLE
  installDate: string;
  endOfLifeDate: string;
  disposalDate?: string;
  assetLifecycleStatus?: AssetLifecycleStatus;
  // INDEX DETAILS
  indexType: IndexType;
  currentIndex?: number;
  indexAtPurchase?: number;
  lastIndexDate?: string;
  // STATUS
  status?: AssetStatus;
  statusSince?: string;
  availabilityPercent?: number;
  lastOperator?: string;
  // MAINTENANCE
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceBudget?: number;
  // Legacy fields
  assetTag?: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  currentValue?: number;
  location?: string;
  warehouseId?: string;
  assignedTo?: string;
  criticality?: AssetCriticality;
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
