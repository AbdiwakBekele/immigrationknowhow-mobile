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

function parseStatePayload(data: unknown): AiAssistantState {
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    subscription: row.subscription,
    is_addon_active: Boolean(row.is_addon_active),
    monthly_price: String(row.monthly_price ?? '4.99'),
    currency: String(row.currency ?? 'USD'),
    chat_messages: Array.isArray(row.chat_messages) ? (row.chat_messages as ChatMessage[]) : [],
  };
}

export async function getAiAssistant(params?: { checkout?: string; session_id?: string }): Promise<
  ApiResponse<{ state: AiAssistantState }>
> {
  try {
    const res = await apiClient.get('/api/mobile/ai-assistant', { params });
    if (res.data?.success === false) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { state: parseStatePayload(res.data?.data) },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function checkoutAiAssistant(): Promise<
  ApiResponse<{ checkout_url: string; checkout_session_id: string }>
> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/checkout');
    if (!res.data?.success) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    const data = res.data.data as { checkout_url?: string; checkout_session_id?: string };
    return {
      success: true,
      message: res.data.message,
      data: {
        checkout_url: String(data.checkout_url ?? ''),
        checkout_session_id: String(data.checkout_session_id ?? ''),
      },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmAiAssistantCheckout(sessionId: string): Promise<ApiResponse<{ state: AiAssistantState }>> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/confirm-checkout', {
      session_id: sessionId,
    });
    if (res.data?.success === false) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { state: parseStatePayload(res.data?.data) },
    };
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
