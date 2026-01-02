import { api } from '../api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const notificationsApi = {
  findAll: () => api.get<ApiResponse<Notification[]>>('/notifications'),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAsRead: (id: string) => api.put<ApiResponse<Notification>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<ApiResponse<{ message: string }>>('/notifications/read-all'),
};
