import { api } from '../api';

export interface DepreciationProfile {
  id: string;
  assetId: string;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  usefulLifeYears: number;
  salvageValue: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  asset?: { id: string; assetTag: string; name: string; acquisitionCost: number; currentValue: number };
  entries?: DepreciationEntry[];
}

export interface DepreciationEntry {
  id: string;
  assetId: string;
  profileId: string;
  period: string;
  depreciationAmount: number;
  bookValueAfter: number;
  isPosted: boolean;
  postedAt?: string;
  createdAt: string;
}

export interface CreateDepreciationProfileDto {
  assetId: string;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  usefulLifeYears: number;
  salvageValue: number;
  startDate: string;
}

export interface RunMonthlyDepreciationDto {
  period: string; // YYYY-MM format
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

export const depreciationApi = {
  findAll: async (page = 1, limit = 20): Promise<PaginatedResponse<DepreciationProfile>> => {
    const res = await api.get(`/depreciation?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  findOne: async (assetId: string): Promise<DepreciationProfile> => {
    const res = await api.get(`/depreciation/assets/${assetId}`);
    return res.data.data;
  },

  createProfile: async (dto: CreateDepreciationProfileDto): Promise<DepreciationProfile> => {
    const res = await api.post('/depreciation/profiles', dto);
    return res.data.data;
  },

  runMonthly: async (dto: RunMonthlyDepreciationDto): Promise<any> => {
    const res = await api.post('/depreciation/run-monthly', dto);
    return res.data.data;
  },

  postEntry: async (assetId: string, period: string): Promise<DepreciationEntry> => {
    const res = await api.post(`/depreciation/post/${assetId}/${period}`);
    return res.data.data;
  },

  postAllForPeriod: async (period: string): Promise<any> => {
    const res = await api.post(`/depreciation/post-period/${period}`);
    return res.data.data;
  },
};
