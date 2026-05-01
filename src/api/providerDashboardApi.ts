import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ProviderDashboardData = {
  stats: Record<string, number>;
  /** Laravel `notifications` unread count (0 if table missing). */
  unread_notifications_count?: number;
  recent_leads: Array<{
    uuid: string;
    status?: string;
    service_type?: string;
    user?: { first_name?: string | null; last_name?: string | null };
    conversation?: { uuid: string } | null;
  }>;
  recent_reviews: unknown[];
  leads_chart_data: Array<{ date: string; count: number }>;
  subscription_checkout_configured: boolean;
  provider: Record<string, unknown>;
};

export async function getProviderDashboard(): Promise<ApiResponse<{ dashboard: ProviderDashboardData }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/dashboard');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { dashboard: res.data?.data as ProviderDashboardData },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
