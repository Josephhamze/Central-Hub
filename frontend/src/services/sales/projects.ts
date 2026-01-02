import { api, type ApiResponse, type PaginatedResponse } from '../api';

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  _count?: { warehouses: number };
}

export interface CreateProjectDto {
  companyId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const projectsApi = {
  findAll: (companyId?: string, page = 1, limit = 100) =>
    api.get<ApiResponse<PaginatedResponse<Project>>>('/projects', { params: { companyId, page, limit } }),
  findOne: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: CreateProjectDto) => api.post<ApiResponse<Project>>('/projects', data),
  update: (id: string, data: Partial<CreateProjectDto>) => api.put<ApiResponse<Project>>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/projects/${id}`),
};
