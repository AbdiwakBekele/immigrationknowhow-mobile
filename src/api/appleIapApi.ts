import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type IapConfig = {
  apple_iap_configured: boolean;
  bundle_id: string;
  sandbox: boolean;
  ai_assistant_product_id: string;
  library_product_prefix: string;
  library_ebook_product_id?: string;
  provider_product_prefix: string;
  provider_monthly_product_id?: string;
  provider_yearly_product_id?: string;
  video_product_prefix: string;
  ad_publish_product_id: string;
  ios_requires_apple_iap: boolean;
};

export type ApplePurchaseConfirmation = {
  transaction_id: string;
  original_transaction_id?: string;
  product_id?: string;
};

export async function getIapConfig(): Promise<ApiResponse<IapConfig>> {
  try {
    const res = await apiClient.get('/api/mobile/iap/config');
    return { success: true, message: res.data?.message ?? 'OK', data: res.data?.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmLibraryApplePurchase(
  slug: string,
  payload: ApplePurchaseConfirmation,
): Promise<ApiResponse<{ fulfilled: boolean; apple_product_id?: string }>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/library/items/${encodeURIComponent(slug)}/apple-purchase`,
      payload,
    );
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmAiAssistantApplePurchase(
  payload: ApplePurchaseConfirmation,
): Promise<ApiResponse<{ subscription: unknown; is_addon_active: boolean }>> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/apple-purchase', payload);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export type RestoreLibraryEntry = {
  transaction_id: string;
  product_id: string;
};

export async function confirmProviderApplePurchase(
  planUuid: string,
  payload: ApplePurchaseConfirmation,
): Promise<ApiResponse<{ subscription: unknown; apple_product_id?: string }>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/provider/subscriptions/apple-purchase/${encodeURIComponent(planUuid)}`,
      payload,
    );
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmAdApplePurchase(
  adUuid: string,
  payload: ApplePurchaseConfirmation,
): Promise<ApiResponse<{ fulfilled: boolean; apple_product_id?: string; ad?: unknown }>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/ads/${encodeURIComponent(adUuid)}/apple-purchase`,
      payload,
    );
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmVideoApplePurchase(
  slug: string,
  payload: ApplePurchaseConfirmation,
): Promise<ApiResponse<{ fulfilled: boolean; apple_product_id?: string }>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/videos/${encodeURIComponent(slug)}/apple-purchase`,
      payload,
    );
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export type RestoreProductEntry = {
  transaction_id: string;
  product_id: string;
};

export async function restoreApplePurchases(payload: {
  library?: RestoreLibraryEntry[];
  ai_assistant?: { transaction_id: string };
  provider_subscriptions?: RestoreProductEntry[];
  videos?: RestoreProductEntry[];
}): Promise<
  ApiResponse<{
    library_restored: number;
    ai_assistant_active: boolean;
    provider_subscription_active: boolean;
    videos_restored: number;
    errors: string[];
  }>
> {
  try {
    const res = await apiClient.post('/api/mobile/iap/restore', payload);
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
