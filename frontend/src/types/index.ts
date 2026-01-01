// Common API types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    path: string;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  themePreference: ThemePreference;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Module placeholder types
export interface ModuleSection {
  name: string;
  description: string;
  status: 'stub' | 'in_progress' | 'complete';
}

export interface ModuleOverview {
  message: string;
  module: string;
  status: string;
  sections?: ModuleSection[];
}
