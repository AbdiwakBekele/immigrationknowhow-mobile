import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type OnboardingMeta = {
  user: any;
  initialStep: number;
  requiresPhoneVerification: boolean;
  phoneVerification: null | {
    phone: string;
    phoneDialOptions: Array<{ value: string; label: string }>;
  };
  isProvider: boolean;
  serviceTypes: Array<{ value: string; label: string }>;
  countryOptions: Array<{ value: string; label: string }>;
  stateOptions: Array<{ value: string; label: string }>;
  languageOptions: Array<{ value: string; label: string }>;
  existingData: Record<string, any>;
  steps: Array<{ key: string; title: string; description: string }>;
  subscriptionPlans: any[];
  stripeBillingReady: boolean;
};

export async function meta(): Promise<ApiResponse<OnboardingMeta>> {
  try {
    const res = await apiClient.get('/api/mobile/onboarding/meta');
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
    const res = await apiClient.post('/api/mobile/onboarding/phone/verify', { code });
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

export async function complete(payload: Record<string, any>): Promise<ApiResponse<{ user?: any; checkout_url?: string }>> {
  try {
    const res = await apiClient.post('/api/mobile/onboarding/complete', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

