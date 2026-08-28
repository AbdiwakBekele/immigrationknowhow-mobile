import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function getShareCampaign(): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/library/share-campaign');
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function startEbookShare(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/share/start`);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function recordEbookShareIntent(
  slug: string,
  platform: 'facebook' | 'x' | 'other',
): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/share/intent`, {
      platform,
    });
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
