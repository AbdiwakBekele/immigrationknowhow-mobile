import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

/** Mirrors `PlatformSetting::dvLotteryContent()` (Laravel). */
export type DvLotteryContent = {
  title?: string;
  short_description?: string;
  description?: string;
  official_url?: string;
  cta_label?: string;
  warning_text?: string;
  open_from?: string | null;
  open_to?: string | null;
  show_in_menu_after_close?: boolean;
  is_open?: boolean;
  is_closed?: boolean;
  is_closing_soon?: boolean;
  show_in_menu?: boolean;
  status_message?: string | null;
};

export async function getDvLottery(): Promise<ApiResponse<{ content: DvLotteryContent }>> {
  try {
    const res = await apiClient.get('/api/mobile/dv-lottery');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { content: (res.data?.data?.content ?? {}) as DvLotteryContent },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
