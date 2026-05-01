import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type DvLotteryContent = Record<string, unknown>;

export async function getDvLottery(): Promise<ApiResponse<{ content: DvLotteryContent }>> {
  try {
    const res = await apiClient.get('/api/mobile/dv-lottery');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { content: res.data?.data?.content as DvLotteryContent },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
