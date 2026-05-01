import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ProviderNotificationRow = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type NotificationsPayload = {
  notifications: {
    data: ProviderNotificationRow[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
  notifications_table_missing: boolean;
};

export async function listProviderNotifications(): Promise<ApiResponse<{ payload: NotificationsPayload }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/notifications');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { payload: res.data?.data as NotificationsPayload },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function markProviderNotificationRead(id: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/notifications/${id}/read`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function markAllProviderNotificationsRead(): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post('/api/mobile/provider/notifications/read-all');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
