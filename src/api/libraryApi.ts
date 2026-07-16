import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export async function browseLibrary(params: Record<string, unknown> = {}): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/library/browse', { params });
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getLibraryItem(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get(`/api/mobile/library/items/${encodeURIComponent(slug)}`);
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getMyLibrary(
  section: 'purchased' | 'available',
  page = 1,
  perPage = 50,
): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.get('/api/mobile/library/my', {
      params: { section, page, per_page: perPage },
    });
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function toggleLibraryFavorite(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/favorite`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function libraryStripeCheckout(slug: string): Promise<ApiResponse<{ checkout_url: string }>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/checkout`);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function libraryConfirmCheckout(slug: string, sessionId: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/confirm-checkout`, { session_id: sessionId });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function libraryGrantFree(slug: string): Promise<ApiResponse<any>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/grant-free`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function redeemEbookCoupon(
  slug: string,
  code?: string,
): Promise<ApiResponse<{ has_access: boolean }>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/redeem-coupon`, {
      ...(code?.trim() ? { code: code.trim() } : {}),
    });
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getLibraryStreamUrls(
  slug: string
): Promise<ApiResponse<{ stream_urls: Record<string, string>; expires_in_seconds?: number }>> {
  try {
    const res = await apiClient.post(`/api/mobile/library/items/${encodeURIComponent(slug)}/stream-urls`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
