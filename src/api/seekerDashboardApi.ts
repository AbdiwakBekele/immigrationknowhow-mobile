import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { ProviderListItem } from '../types/provider';

export type SeekerDashboardData = {
  stats: {
    totalLeads: number;
    unreadMessages: number;
    profileCompletion: number;
  };
  recent_leads: unknown[];
  recent_messages: Array<{
    uuid: string;
    subject: string | null;
    last_message_at: string | null;
    latest_message?: {
      body: string;
      created_at: string | null;
    } | null;
    provider_user?: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
  recommended_providers: ProviderListItem[];
  saved_providers: ProviderListItem[];
  library_items: unknown[];
  purchased_items: unknown[];
};

export async function getSeekerDashboard(): Promise<ApiResponse<{ dashboard: SeekerDashboardData }>> {
  try {
    const res = await apiClient.get('/api/mobile/seeker/dashboard');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { dashboard: res.data?.data as SeekerDashboardData },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
