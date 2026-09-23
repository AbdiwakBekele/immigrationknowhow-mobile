import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type PhoneDialOption = { value: string; label: string; dial: string };

export type SubscriptionPlanOption = {
  uuid: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency?: string;
  billing_cycle?: string;
  apple_product_id?: string | null;
  features?: unknown[];
  is_featured?: boolean;
  /** When set, plan is scoped to this service type (`Onboarding/Index.vue` eligibility). */
  service_type_option_id?: number | null;
  service_type_option?: null | {
    value: string;
    label?: string;
  };
};

export type OnboardingMeta = {
  user: any;
  initialStep: number;
  requiresPhoneVerification: boolean;
  phoneVerification: null | {
    phone: string;
    phoneDialOptions: PhoneDialOption[];
  };
  isProvider: boolean;
  isAdvertiser: boolean;
  serviceTypes: Array<{ value: string; label: string }>;
  countryOptions: Array<{ value: string; label: string }>;
  stateOptions: Array<{ value: string; label: string }>;
  languageOptions: Array<{ value: string; label: string }>;
  existingData: Record<string, any>;
  steps: Array<{ key: string; title: string; description: string }>;
  subscriptionPlans: SubscriptionPlanOption[];
  stripeBillingReady: boolean;
  appleIapConfigured?: boolean;
  ios_requires_apple_iap?: boolean;
  providerSubscriptionPromo?: {
    trial_months: number;
    trial_eligible: boolean;
  } | null;
};

export async function meta(params?: { country?: string; step?: number; intent?: 'provider' }): Promise<ApiResponse<OnboardingMeta>> {
  try {
    const res = await apiClient.get('/api/mobile/onboarding/meta', {
      params:
        params && (params.country !== undefined || params.step !== undefined || params.intent !== undefined)
          ? params
          : undefined,
    });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function sendOtp(payload: Record<string, any>): Promise<ApiResponse<{ nextStep: number }>> {
  try {
    const res = await apiClient.post('/api/mobile/onboarding/address/send-otp', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function verifyOtp(code: string): Promise<ApiResponse<{ nextStep: number }>> {
  try {
    const res = await apiClient.post('/api/mobile/onboarding/phone/verify', {
      code: code.replace(/\D/g, '').slice(0, 32),
    });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function saveProgress(step: string, data: Record<string, any>): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post('/api/mobile/onboarding/progress', { step, data });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function complete(payload: Record<string, any>): Promise<ApiResponse<{ user?: import('../types/user').AuthUser; checkout_url?: string }>> {
  try {
    const res = await apiClient.post('/api/mobile/onboarding/complete', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

