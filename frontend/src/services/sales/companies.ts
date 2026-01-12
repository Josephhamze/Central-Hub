import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  nif?: string;
  rccm?: string;
  idNational?: string;
  vat?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  legalName?: string;
  nif?: string;
  rccm?: string;
  idNational?: string;
  vat?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export const companiesApi = {
  findAll: (page = 1, limit = 20, search?: string) =>
    api.get<ApiResponse<PaginatedResponse<Company>>>('/companies', { params: { page, limit, search } }),
  findOne: (id: string) => api.get<ApiResponse<Company>>(`/companies/${id}`),
  create: (data: CreateCompanyDto) => api.post<ApiResponse<Company>>('/companies', data),
  update: (id: string, data: Partial<CreateCompanyDto>) => api.put<ApiResponse<Company>>(`/companies/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/companies/${id}`),
};
