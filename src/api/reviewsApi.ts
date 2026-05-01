import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function listMyReviews(page = 1): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/reviews', { params: { page } });
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function submitReview(
  providerSlug: string,
  payload: {
    overall_rating: number;
    comment: string;
    communication_rating?: number;
    expertise_rating?: number;
    value_rating?: number;
    would_recommend?: boolean;
  }
): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/reviews/providers/${encodeURIComponent(providerSlug)}`, payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function toggleReviewHelpful(uuid: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/reviews/${uuid}/helpful`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
