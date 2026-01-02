import { api } from '../api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roles?: Role[];
  themePreference?: 'LIGHT' | 'DARK' | 'SYSTEM';
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  userCount?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRolesDto {
  roleIds: string[];
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

export const usersApi = {
  findAll: async (page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const res = await api.get(`/users?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  findOne: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  activate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/activate`);
  },

  deactivate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/deactivate`);
  },

  assignRoles: async (id: string, roleIds: string[]): Promise<User> => {
    const res = await api.put(`/users/${id}/roles`, { roleIds });
    return res.data.data;
  },
};

export const rolesApi = {
  findAll: async (): Promise<Role[]> => {
    const res = await api.get('/roles');
    return res.data.data;
  },

  findOne: async (id: string): Promise<Role> => {
    const res = await api.get(`/roles/${id}`);
    return res.data.data;
  },

  create: async (dto: CreateRoleDto): Promise<Role> => {
    const res = await api.post('/roles', dto);
    return res.data.data;
  },

  update: async (id: string, dto: UpdateRoleDto): Promise<Role> => {
    const res = await api.put(`/roles/${id}`, dto);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  getAllPermissions: async (): Promise<{
    permissions: Permission[];
    byModule: Record<string, Permission[]>;
  }> => {
    const res = await api.get('/roles/permissions');
    return res.data.data;
  },
};
