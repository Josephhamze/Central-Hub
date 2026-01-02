import { api, type ApiResponse, type PaginatedResponse } from '../api';

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface Customer {
  id: string;
  type: CustomerType;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  type: CustomerType;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
}

export const customersApi = {
  findAll: (page = 1, limit = 100, search?: string, type?: CustomerType) =>
    api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params: { page, limit, search, type } }),
  findOne: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: CreateCustomerDto) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<CreateCustomerDto>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/customers/${id}`),
};
