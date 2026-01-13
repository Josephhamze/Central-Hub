import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type Shift = 'DAY' | 'NIGHT';
export type EntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type QualityGrade = 'PREMIUM' | 'STANDARD' | 'OFF_SPEC';

export interface ExcavatorEntry {
  id: string;
  date: string;
  shift: Shift;
  excavatorId: string;
  operatorId: string;
  materialTypeId: string;
  pitLocationId: string;
  bucketCount: number;
  estimatedVolume: number;
  estimatedTonnage: number;
  downtimeHours?: number;
  notes?: string;
  status: EntryStatus;
  approverId?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  excavator?: { id: string; name: string; bucketCapacity: number };
  operator?: { id: string; firstName: string; lastName: string; email: string };
  materialType?: { id: string; name: string; density: number };
  pitLocation?: { id: string; name: string };
  createdBy?: { id: string; firstName: string; lastName: string };
  approver?: { id: string; firstName: string; lastName: string };
}

export interface HaulingEntry {
  id: string;
  date: string;
  shift: Shift;
  truckId: string;
  driverId: string;
  excavatorEntryId?: string;
  tripCount: number;
  totalHauled: number;
  avgCycleTime?: number;
  fuelConsumption?: number;
  notes?: string;
  status: EntryStatus;
  approverId?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  truck?: { id: string; name: string; loadCapacity: number };
  driver?: { id: string; firstName: string; lastName: string; email: string };
  sourceExcavatorEntry?: { id: string; date: string; shift: Shift; estimatedTonnage: number };
  createdBy?: { id: string; firstName: string; lastName: string };
  approver?: { id: string; firstName: string; lastName: string };
}

export interface CrusherFeedEntry {
  id: string;
  date: string;
  shift: Shift;
  crusherId: string;
  materialTypeId: string;
  feedStartTime: string;
  feedEndTime: string;
  truckLoadsReceived: number;
  weighBridgeTonnage: number;
  feedRate?: number;
  rejectOversizeTonnage?: number;
  notes?: string;
  status: EntryStatus;
  approverId?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  crusher?: { id: string; name: string; type: string; ratedCapacity: number };
  materialType?: { id: string; name: string; density: number };
  createdBy?: { id: string; firstName: string; lastName: string };
  approver?: { id: string; firstName: string; lastName: string };
}

export interface CrusherOutputEntry {
  id: string;
  date: string;
  shift: Shift;
  crusherId: string;
  productTypeId: string;
  stockpileLocationId: string;
  outputTonnage: number;
  yieldPercentage?: number;
  qualityGrade: QualityGrade;
  moisturePercentage?: number;
  notes?: string;
  status: EntryStatus;
  approverId?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  crusher?: { id: string; name: string; type: string };
  productType?: { id: string; name: string };
  stockpileLocation?: { id: string; name: string };
  createdBy?: { id: string; firstName: string; lastName: string };
  approver?: { id: string; firstName: string; lastName: string };
}

// Excavator Entries
export const excavatorEntriesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    shift?: Shift;
    excavatorId?: string;
    operatorId?: string;
    status?: EntryStatus;
  }) =>
    api.get<ApiResponse<PaginatedResponse<ExcavatorEntry>>>('/quarry-production/excavator-entries', { params }),

  get: (id: string) =>
    api.get<ApiResponse<ExcavatorEntry>>(`/quarry-production/excavator-entries/${id}`),

  create: (data: {
    date: string;
    shift: Shift;
    excavatorId: string;
    operatorId: string;
    materialTypeId: string;
    pitLocationId: string;
    bucketCount: number;
    downtimeHours?: number;
    notes?: string;
  }) =>
    api.post<ApiResponse<ExcavatorEntry>>('/quarry-production/excavator-entries', data),

  update: (id: string, data: Partial<{
    date: string;
    shift: Shift;
    excavatorId: string;
    operatorId: string;
    materialTypeId: string;
    pitLocationId: string;
    bucketCount: number;
    downtimeHours?: number;
    notes?: string;
  }>) =>
    api.patch<ApiResponse<ExcavatorEntry>>(`/quarry-production/excavator-entries/${id}`, data),

  approve: (id: string, notes?: string) =>
    api.post<ApiResponse<ExcavatorEntry>>(`/quarry-production/excavator-entries/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<ExcavatorEntry>>(`/quarry-production/excavator-entries/${id}/reject`, { reason }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/excavator-entries/${id}`),
};

// Hauling Entries
export const haulingEntriesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    shift?: Shift;
    truckId?: string;
    driverId?: string;
    status?: EntryStatus;
  }) =>
    api.get<ApiResponse<PaginatedResponse<HaulingEntry>>>('/quarry-production/hauling-entries', { params }),

  get: (id: string) =>
    api.get<ApiResponse<HaulingEntry>>(`/quarry-production/hauling-entries/${id}`),

  create: (data: {
    date: string;
    shift: Shift;
    truckId: string;
    driverId: string;
    excavatorEntryId?: string;
    tripCount: number;
    avgCycleTime?: number;
    fuelConsumption?: number;
    notes?: string;
  }) =>
    api.post<ApiResponse<HaulingEntry>>('/quarry-production/hauling-entries', data),

  update: (id: string, data: Partial<{
    date: string;
    shift: Shift;
    truckId: string;
    driverId: string;
    excavatorEntryId?: string;
    tripCount: number;
    avgCycleTime?: number;
    fuelConsumption?: number;
    notes?: string;
  }>) =>
    api.patch<ApiResponse<HaulingEntry>>(`/quarry-production/hauling-entries/${id}`, data),

  approve: (id: string, notes?: string) =>
    api.post<ApiResponse<HaulingEntry>>(`/quarry-production/hauling-entries/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<HaulingEntry>>(`/quarry-production/hauling-entries/${id}/reject`, { reason }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/hauling-entries/${id}`),
};

// Crusher Feed Entries
export const crusherFeedEntriesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    shift?: Shift;
    crusherId?: string;
    status?: EntryStatus;
  }) =>
    api.get<ApiResponse<PaginatedResponse<CrusherFeedEntry>>>('/quarry-production/crusher-feed-entries', { params }),

  get: (id: string) =>
    api.get<ApiResponse<CrusherFeedEntry>>(`/quarry-production/crusher-feed-entries/${id}`),

  create: (data: {
    date: string;
    shift: Shift;
    crusherId: string;
    materialTypeId: string;
    feedStartTime: string;
    feedEndTime: string;
    truckLoadsReceived: number;
    weighBridgeTonnage: number;
    rejectOversizeTonnage?: number;
    notes?: string;
  }) =>
    api.post<ApiResponse<CrusherFeedEntry>>('/quarry-production/crusher-feed-entries', data),

  update: (id: string, data: Partial<{
    date: string;
    shift: Shift;
    crusherId: string;
    materialTypeId: string;
    feedStartTime: string;
    feedEndTime: string;
    truckLoadsReceived: number;
    weighBridgeTonnage: number;
    rejectOversizeTonnage?: number;
    notes?: string;
  }>) =>
    api.patch<ApiResponse<CrusherFeedEntry>>(`/quarry-production/crusher-feed-entries/${id}`, data),

  approve: (id: string, notes?: string) =>
    api.post<ApiResponse<CrusherFeedEntry>>(`/quarry-production/crusher-feed-entries/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<CrusherFeedEntry>>(`/quarry-production/crusher-feed-entries/${id}/reject`, { reason }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/crusher-feed-entries/${id}`),
};

// Crusher Output Entries
export const crusherOutputEntriesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    shift?: Shift;
    crusherId?: string;
    productTypeId?: string;
    status?: EntryStatus;
  }) =>
    api.get<ApiResponse<PaginatedResponse<CrusherOutputEntry>>>('/quarry-production/crusher-output-entries', { params }),

  get: (id: string) =>
    api.get<ApiResponse<CrusherOutputEntry>>(`/quarry-production/crusher-output-entries/${id}`),

  create: (data: {
    date: string;
    shift: Shift;
    crusherId: string;
    productTypeId: string;
    stockpileLocationId: string;
    outputTonnage: number;
    qualityGrade: QualityGrade;
    moisturePercentage?: number;
    notes?: string;
  }) =>
    api.post<ApiResponse<CrusherOutputEntry>>('/quarry-production/crusher-output-entries', data),

  update: (id: string, data: Partial<{
    date: string;
    shift: Shift;
    crusherId: string;
    productTypeId: string;
    stockpileLocationId: string;
    outputTonnage: number;
    qualityGrade: QualityGrade;
    moisturePercentage?: number;
    notes?: string;
  }>) =>
    api.patch<ApiResponse<CrusherOutputEntry>>(`/quarry-production/crusher-output-entries/${id}`, data),

  approve: (id: string, notes?: string) =>
    api.post<ApiResponse<CrusherOutputEntry>>(`/quarry-production/crusher-output-entries/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<CrusherOutputEntry>>(`/quarry-production/crusher-output-entries/${id}/reject`, { reason }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/quarry-production/crusher-output-entries/${id}`),
};
