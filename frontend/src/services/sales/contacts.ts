import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  roleTitle?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; type: string; companyName?: string; firstName?: string; lastName?: string };
}

export interface CreateContactDto {
  customerId: string;
  name: string;
  roleTitle?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export const contactsApi = {
  findAll: (customerId?: string, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<Contact>>>('/contacts', { params: { customerId, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<Contact>>(`/contacts/${id}`),
  create: (data: CreateContactDto) => api.post<ApiResponse<Contact>>('/contacts', data),
  update: (id: string, data: Partial<CreateContactDto>) => api.put<ApiResponse<Contact>>(`/contacts/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/contacts/${id}`),
};
