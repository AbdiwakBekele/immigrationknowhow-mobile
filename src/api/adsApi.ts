import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function listAds(): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/ads');
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getAdsAnalytics(): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/ads/analytics');
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function createAd(payload: {
  title: string;
  description: string;
  cta_url: string;
  image_url?: string | null;
}): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post('/api/mobile/ads', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function updateAd(uuid: string, payload: Partial<{ title: string; description: string; cta_url: string; image_url: string | null }>): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.patch(`/api/mobile/ads/${uuid}`, payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function checkoutAd(uuid: string): Promise<ApiResponse<{ checkout_url: string }>> {
  try {
    const res = await apiClient.post(`/api/mobile/ads/${uuid}/checkout`);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function resubmitAd(uuid: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/ads/${uuid}/resubmit`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
