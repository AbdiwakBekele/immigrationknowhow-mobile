import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ProviderDashboardStats = {
  totalLeads: number;
  newLeads: number;
  openLeads: number;
  convertedLeads: number;
  conversionRate: number;
  profileViews: number;
  leadsTrend: number;
  viewsTrend: number;
};

export type ProviderDashboardProvider = {
  id: number;
  slug?: string;
  business_name?: string | null;
  average_rating?: string | number | null;
  total_reviews?: number | null;
  background_check_status?: string | null;
  is_featured?: boolean;
  profile_views?: number | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  stripe_subscription_status?: string | null;
};

export type ProviderRecentReview = {
  id?: number;
  rating?: number;
  comment?: string | null;
  created_at?: string | null;
  user?: { first_name?: string | null; last_name?: string | null } | null;
};

export type ProviderDashboardData = {
  stats: ProviderDashboardStats;
  /** Laravel `notifications` unread count (0 if table missing). */
  unread_notifications_count?: number;
  recent_leads: Array<{
    uuid: string;
    status?: string;
    service_type?: string;
    created_at?: string | null;
    user?: { first_name?: string | null; last_name?: string | null; avatar?: string | null; avatar_url?: string | null };
    conversation?: { uuid: string } | null;
  }>;
  recent_reviews: ProviderRecentReview[];
  leads_chart_data: Array<{ date: string; count: number }>;
  subscription_checkout_configured: boolean;
  provider: ProviderDashboardProvider;
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
