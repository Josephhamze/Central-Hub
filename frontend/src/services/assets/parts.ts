import { api } from '../api';

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  uom: string;
  warehouseId: string;
  quantityOnHand: number;
  minStockLevel: number;
  unitCost: number;
  isCritical: boolean;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string };
  isLowStock?: boolean;
}

export interface CreateSparePartDto {
  name: string;
  sku: string;
  uom: string;
  warehouseId: string;
  quantityOnHand?: number;
  minStockLevel?: number;
  unitCost: number;
  isCritical?: boolean;
}

export interface UpdateSparePartDto extends Partial<CreateSparePartDto> {}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sparePartsApi = {
  findAll: async (page = 1, limit = 20, search?: string, warehouseId?: string): Promise<PaginatedResponse<SparePart>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (warehouseId) params.append('warehouseId', warehouseId);
    const res = await api.get(`/spare-parts?${params.toString()}`);
    return res.data.data;
  },

  findOne: async (id: string): Promise<SparePart> => {
    const res = await api.get(`/spare-parts/${id}`);
    return res.data.data;
  },

  getLowStock: async (): Promise<SparePart[]> => {
    const res = await api.get('/spare-parts/low-stock');
    return res.data.data;
  },

  create: async (dto: CreateSparePartDto): Promise<SparePart> => {
    const res = await api.post('/spare-parts', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateSparePartDto): Promise<SparePart> => {
    const res = await api.put(`/spare-parts/${id}`, dto);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/spare-parts/${id}`);
  },
};
