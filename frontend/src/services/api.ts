import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Only log unexpected errors in development
    if (import.meta.env.DEV && error.response?.status !== 401 && error.response?.status !== 403) {
      const errorData = error.response?.data as ApiError | undefined;
      const errorMessage = errorData?.error?.message || (errorData as any)?.message || error.message;
      // eslint-disable-next-line no-console
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
      });
    }

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        try {
          const { refreshToken } = JSON.parse(tokens);
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const newTokens = response.data.data;
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          setAuthToken(newTokens.accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens and redirect to login
          clearAuthToken();
          localStorage.removeItem('auth_tokens');
          window.location.href = '/login';
        }
      }
    }

    // For 404/500 errors, return a more graceful error
    if (error.response?.status === 404 || error.response?.status === 500) {
      // Don't crash the app, just reject with error
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
  };
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

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.error?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}


