import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: string | null;
};

export type AiAssistantState = {
  subscription: unknown;
  is_addon_active: boolean;
  monthly_price: string;
  currency: string;
  chat_messages: ChatMessage[];
};

export async function getAiAssistant(params?: { checkout?: string; session_id?: string }): Promise<
  ApiResponse<{ state: AiAssistantState }>
> {
  try {
    const res = await apiClient.get('/api/mobile/ai-assistant', { params });
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { state: res.data?.data as AiAssistantState },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function checkoutAiAssistant(): Promise<ApiResponse<{ checkout_url: string }>> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/checkout');
    if (!res.data?.success) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function askAiAssistant(question: string): Promise<
  ApiResponse<{ question: string; answer: string | null; providers: unknown[] }>
> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/ask', { question });
    if (!res.data?.success) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}
