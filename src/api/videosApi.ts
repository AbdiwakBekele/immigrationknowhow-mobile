import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function listVideos(params: Record<string, unknown> = {}): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/videos', { params });
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getVideo(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get(`/api/mobile/videos/${encodeURIComponent(slug)}`);
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function videoCheckout(slug: string): Promise<ApiResponse<{ checkout_url: string }>> {
  try {
    const res = await apiClient.post(`/api/mobile/videos/${encodeURIComponent(slug)}/checkout`);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function videoGrantFree(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/videos/${encodeURIComponent(slug)}/grant-free`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmVideoCheckout(
  slug: string,
  sessionId: string,
): Promise<ApiResponse<{ fulfilled?: boolean }>> {
  try {
    const res = await apiClient.post(`/api/mobile/videos/${encodeURIComponent(slug)}/confirm-checkout`, {
      session_id: sessionId,
    });
    if (res.data?.success === false) {
      return {
        success: false,
        message: typeof res.data.message === 'string' ? res.data.message : 'Could not confirm purchase.',
        errors: res.data.errors,
      };
    }
    return {
      success: true,
      message: typeof res.data?.message === 'string' ? res.data.message : 'OK',
      data: res.data?.data ?? {},
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
