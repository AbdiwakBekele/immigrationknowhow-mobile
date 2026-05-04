import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type BackgroundCheckRow = {
  uuid: string;
  status: string;
  status_display?: string;
  initiated_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  days_until_expiry?: number | null;
  is_valid?: boolean;
};

export type ProviderBackgroundChecksPayload = {
  provider: { business_name?: string | null; background_check_status?: string | null };
  background_check: (BackgroundCheckRow & { can_initiate?: boolean }) | null;
  history: BackgroundCheckRow[];
  can_initiate: boolean;
  user: { first_name?: string; last_name?: string; email?: string; phone?: string | null };
};

export async function getProviderBackgroundChecks(): Promise<ApiResponse<{ payload: ProviderBackgroundChecksPayload }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/background-checks');
    return { success: true, message: res.data?.message ?? 'OK', data: { payload: res.data?.data } };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function startProviderBackgroundCheck(payload: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone: string;
  zipcode: string;
  dob: string; // YYYY-MM-DD
  ssn: string;
  driver_license_number?: string | null;
  driver_license_state?: string | null;
  consent: boolean;
}): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post('/api/mobile/provider/background-checks', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function refreshProviderBackgroundCheck(uuid: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/background-checks/${encodeURIComponent(uuid)}/refresh`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

