import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { AuthUser } from '../types/user';

export type RoleMeta = {
  roles: string[];
  has_seeker: boolean;
  has_provider: boolean;
  can_add_seeker: boolean;
  can_add_provider: boolean;
  can_switch: boolean;
};

export type EnableSeekerPayload = {
  number_of_children?: number | null;
  children_ages_text?: string | null;
  dogs_count?: number | null;
  services_needed?: string[];
};

export async function getRoleMeta(): Promise<ApiResponse<RoleMeta>> {
  try {
    const res = await apiClient.get('/api/mobile/roles/meta');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function enableSeeker(payload: EnableSeekerPayload): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const res = await apiClient.post('/api/mobile/roles/seeker', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function startProvider(): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const res = await apiClient.post('/api/mobile/roles/provider/start');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
