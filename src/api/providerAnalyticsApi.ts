import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ProviderAnalyticsPayload = {
  period: number;
  stats: {
    leads: { total: number; change: number; converted: number; conversionRate: number };
    reviews: { total: number; averageRating: number; fiveStars: number; needsResponse: number };
    profileViews: { total: number; change: number; unique: number };
    avgResponseTime: string;
  };
  trends: {
    leads: Array<{ date: string; count: number }>;
  };
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
  topServices: Array<{ service: string; label: string; count: number }>;
};

export async function getProviderAnalytics(period = 30): Promise<ApiResponse<{ analytics: ProviderAnalyticsPayload }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/analytics', { params: { period } });
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { analytics: res.data?.data as ProviderAnalyticsPayload },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

