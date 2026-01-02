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
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
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
  billingAddressLine1: string; // Required
  billingAddressLine2?: string;
  billingCity: string; // Required
  billingState?: string;
  billingPostalCode: string; // Required
  billingCountry?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
}

export const customersApi = {
  findAll: (page = 1, limit = 100, search?: string, type?: CustomerType) =>
    api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params: { page, limit, search, type } }),
  findOne: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: CreateCustomerDto) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<CreateCustomerDto>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/customers/${id}`),
};
