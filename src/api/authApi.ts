import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { AuthUser, UserRole } from '../types/user';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: Extract<UserRole, 'user' | 'provider' | 'advertiser'>;
  service_type?: string | null;
};

export type AuthTokenResponse = {
  token: string;
  user: AuthUser;
};

export async function login(payload: LoginPayload): Promise<ApiResponse<AuthTokenResponse>> {
  try {
    const res = await apiClient.post('/api/mobile/auth/login', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function register(payload: RegisterPayload): Promise<ApiResponse<AuthTokenResponse>> {
  try {
    const res = await apiClient.post('/api/mobile/auth/register', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function me(): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const res = await apiClient.get('/api/mobile/auth/me');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function logout(): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post('/api/mobile/auth/logout');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

