import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function listProviderReviews(page = 1, perPage = 15): Promise<ApiResponse<{ reviews: any }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/reviews', {
      params: { page, per_page: perPage },
    });
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: res.data?.data,
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
