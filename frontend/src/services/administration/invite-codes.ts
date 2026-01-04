import { api, type ApiResponse } from '../api';

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string;
  maxUses: number;
  useCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateInviteCodeDto {
  maxUses?: number;
  expiresAt?: string;
}

export const inviteCodesApi = {
  findAll: () => api.get<ApiResponse<InviteCode[]>>('/invite-codes'),
  create: (data: CreateInviteCodeDto) =>
    api.post<ApiResponse<InviteCode>>('/invite-codes', data),
  deactivate: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/invite-codes/${id}`),
};
