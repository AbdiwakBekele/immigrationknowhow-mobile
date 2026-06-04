import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type DeleteAccountPayload = {
  password: string;
  confirmation: string;
};

export async function deleteAccount(payload: DeleteAccountPayload): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.delete('/api/mobile/account', { data: payload });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
