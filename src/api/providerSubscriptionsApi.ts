import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type SubscriptionPlanRow = {
  uuid: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  billing_cycle: string | null;
  status: string;
  stripe_price_id: string | null;
  apple_product_id?: string | null;
};

export type ProviderSubscriptionRow = {
  uuid: string;
  status: string;
  cancel_at_period_end?: boolean;
  apple_original_transaction_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: SubscriptionPlanRow | null;
};

export type SubscriptionsPayload = {
  plans: SubscriptionPlanRow[];
  current_subscription: ProviderSubscriptionRow | null;
  pending_subscription?: ProviderSubscriptionRow | null;
  has_active_subscription?: boolean;
  requires_subscription?: boolean;
  subscription_history: ProviderSubscriptionRow[];
  stripe_billing_configured: boolean;
  apple_iap_configured?: boolean;
  subscription_billing_configured?: boolean;
  ios_requires_apple_iap?: boolean;
  provider_subscription_promo?: {
    trial_months: number;
    trial_eligible: boolean;
  };
};

export async function getProviderSubscriptions(): Promise<ApiResponse<{ subscriptions: SubscriptionsPayload }>> {
  try {
    const res = await apiClient.get('/api/mobile/provider/subscriptions');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { subscriptions: res.data?.data as SubscriptionsPayload },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function startSubscriptionCheckout(planUuid: string): Promise<
  ApiResponse<{ checkout_url: string | null; free_plan_activated?: boolean }>
> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/subscriptions/checkout/${planUuid}`);
    const body = res.data;
    if (body && typeof body === 'object' && body.success === false) {
      return {
        success: false,
        message: typeof body.message === 'string' ? body.message : 'Checkout failed',
        errors: body.errors,
      };
    }
    return {
      success: true,
      message: typeof body?.message === 'string' ? body.message : 'OK',
      data: body?.data ?? { checkout_url: null },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function cancelSubscription(subscriptionUuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/subscriptions/${subscriptionUuid}/cancel`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function resumeSubscription(subscriptionUuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/subscriptions/${subscriptionUuid}/resume`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function changeSubscriptionPlan(
  subscriptionUuid: string,
  planUuid: string
): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(
      `/api/mobile/provider/subscriptions/${subscriptionUuid}/change-plan/${planUuid}`
    );
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
