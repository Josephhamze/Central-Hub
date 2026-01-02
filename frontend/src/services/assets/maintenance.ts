import { api } from '../api';

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  type: 'TIME_BASED' | 'USAGE_BASED';
  intervalDays?: number;
  intervalHours?: number;
  checklistJson?: any;
  estimatedDurationHours?: number;
  requiredPartsJson?: any;
  isActive: boolean;
  lastPerformedAt?: string;
  nextDueAt?: string;
  createdAt: string;
  updatedAt: string;
  asset?: { id: string; assetTag: string; name: string; status: string };
}

export interface CreateMaintenanceScheduleDto {
  assetId: string;
  type: 'TIME_BASED' | 'USAGE_BASED';
  intervalDays?: number;
  intervalHours?: number;
  checklistJson?: any;
  estimatedDurationHours?: number;
  requiredPartsJson?: any;
  isActive?: boolean;
}

export interface UpdateMaintenanceScheduleDto extends Partial<CreateMaintenanceScheduleDto> {}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const maintenanceSchedulesApi = {
  findAll: async (page = 1, limit = 20, assetId?: string, isActive?: boolean): Promise<PaginatedResponse<MaintenanceSchedule>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (assetId) params.append('assetId', assetId);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    const res = await api.get(`/maintenance-schedules?${params.toString()}`);
    return res.data.data;
  },

  findOne: async (id: string): Promise<MaintenanceSchedule> => {
    const res = await api.get(`/maintenance-schedules/${id}`);
    return res.data.data;
  },

  getOverdue: async (): Promise<MaintenanceSchedule[]> => {
    const res = await api.get('/maintenance-schedules/overdue');
    return res.data.data;
  },

  create: async (dto: CreateMaintenanceScheduleDto): Promise<MaintenanceSchedule> => {
    const res = await api.post('/maintenance-schedules', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateMaintenanceScheduleDto): Promise<MaintenanceSchedule> => {
    const res = await api.put(`/maintenance-schedules/${id}`, dto);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/maintenance-schedules/${id}`);
  },
};
