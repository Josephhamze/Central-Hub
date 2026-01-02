import { api } from '../api';

export interface WorkOrder {
  id: string;
  assetId: string;
  scheduleId?: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
  description: string;
  assignedToUserId?: string;
  startedAt?: string;
  completedAt?: string;
  downtimeHours?: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  asset?: { id: string; assetTag: string; name: string; status: string };
  schedule?: { id: string; type: string };
  assignedTo?: { id: string; firstName: string; lastName: string; email: string };
  partUsages?: Array<{
    id: string;
    quantityUsed: number;
    costSnapshot: number;
    sparePart: { id: string; name: string; sku: string };
  }>;
}

export interface CreateWorkOrderDto {
  assetId: string;
  scheduleId?: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  assignedToUserId?: string;
  notes?: string;
}

export interface UpdateWorkOrderDto extends Partial<CreateWorkOrderDto> {}

export interface CompleteWorkOrderDto {
  downtimeHours?: number;
  laborCost?: number;
  notes?: string;
}

export interface ConsumePartDto {
  sparePartId: string;
  quantityUsed: number;
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

export const workOrdersApi = {
  findAll: async (page = 1, limit = 20, status?: string, assetId?: string): Promise<PaginatedResponse<WorkOrder>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (assetId) params.append('assetId', assetId);
    const res = await api.get(`/work-orders?${params.toString()}`);
    return res.data.data;
  },

  findOne: async (id: string): Promise<WorkOrder> => {
    const res = await api.get(`/work-orders/${id}`);
    return res.data.data;
  },

  create: async (dto: CreateWorkOrderDto): Promise<WorkOrder> => {
    const res = await api.post('/work-orders', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> => {
    const res = await api.put(`/work-orders/${id}`, dto);
    return res.data.data;
  },

  start: async (id: string): Promise<WorkOrder> => {
    const res = await api.patch(`/work-orders/${id}/start`);
    return res.data.data;
  },

  complete: async (id: string, dto: CompleteWorkOrderDto): Promise<WorkOrder> => {
    const res = await api.patch(`/work-orders/${id}/complete`, dto);
    return res.data.data;
  },

  cancel: async (id: string): Promise<WorkOrder> => {
    const res = await api.patch(`/work-orders/${id}/cancel`);
    return res.data.data;
  },

  consumePart: async (workOrderId: string, dto: ConsumePartDto): Promise<any> => {
    const res = await api.post(`/work-orders/${workOrderId}/consume-part`, dto);
    return res.data.data;
  },
};
