import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type IapConfig = {
  apple_iap_configured: boolean;
  bundle_id: string;
  sandbox: boolean;
  ai_assistant_product_id: string;
  library_product_prefix: string;
  ios_requires_apple_iap: boolean;
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
  transactionId: string,
): Promise<ApiResponse<{ fulfilled: boolean; apple_product_id?: string }>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/library/items/${encodeURIComponent(slug)}/apple-purchase`,
      { transaction_id: transactionId },
    );
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmAiAssistantApplePurchase(
  transactionId: string,
): Promise<ApiResponse<{ subscription: unknown; is_addon_active: boolean }>> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/apple-purchase', {
      transaction_id: transactionId,
    });
    return res.data?.success === false ? normalizeApiError({ response: { data: res.data } }) : res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export type RestoreLibraryEntry = {
  transaction_id: string;
  product_id: string;
};

export async function restoreApplePurchases(payload: {
  library?: RestoreLibraryEntry[];
  ai_assistant?: { transaction_id: string };
}): Promise<
  ApiResponse<{
    library_restored: number;
    ai_assistant_active: boolean;
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
