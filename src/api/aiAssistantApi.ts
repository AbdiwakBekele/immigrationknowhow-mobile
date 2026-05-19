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

function parseIsAddonActive(row: Record<string, unknown>): boolean {
  const flag = row.is_addon_active;
  if (flag === true || flag === 1 || flag === '1' || flag === 'true') {
    return true;
  }

  const sub = row.subscription;
  if (sub && typeof sub === 'object') {
    const status = String((sub as { status?: unknown }).status ?? '').toLowerCase();
    if (status === 'active' || status === 'trialing' || status === 'past_due') {
      return true;
    }
  }

  return false;
}

function parseStatePayload(data: unknown): AiAssistantState {
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    subscription: row.subscription,
    is_addon_active: parseIsAddonActive(row),
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

export type AiAssistantCheckoutData = {
  checkout_url: string;
  checkout_session_id: string;
  already_subscribed?: boolean;
  state?: AiAssistantState;
};

export async function checkoutAiAssistant(): Promise<ApiResponse<AiAssistantCheckoutData>> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/checkout');
    if (!res.data?.success) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    const data = (res.data.data ?? {}) as Record<string, unknown>;
    const alreadySubscribed = data.already_subscribed === true;

    return {
      success: true,
      message: res.data.message,
      data: {
        checkout_url: String(data.checkout_url ?? ''),
        checkout_session_id: String(data.checkout_session_id ?? ''),
        already_subscribed: alreadySubscribed,
        state: alreadySubscribed ? parseStatePayload(data) : undefined,
      },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function confirmAiAssistantCheckout(sessionId: string): Promise<ApiResponse<{ state: AiAssistantState }>> {
  try {
    const res = await apiClient.post(
      '/api/mobile/ai-assistant/confirm-checkout',
      { session_id: sessionId },
      { timeout: 90_000 },
    );
    if (res.data?.success === false) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }

    let state = parseStatePayload(res.data?.data);
    if (!state.is_addon_active) {
      const refresh = await getAiAssistant();
      if (refresh.success && refresh.data.state.is_addon_active) {
        state = refresh.data.state;
      }
    }

    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { state },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function askAiAssistant(question: string): Promise<
  ApiResponse<{ question: string; answer: string | null; providers: unknown[] }>
> {
  try {
    const res = await apiClient.post('/api/mobile/ai-assistant/ask', { question }, { timeout: 120_000 });
    if (!res.data?.success) {
      return normalizeApiError({ response: { data: res.data, status: 422 } });
    }
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}
