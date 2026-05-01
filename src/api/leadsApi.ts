import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type CreateLeadPayload = {
  service_type: string;
  message: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  preferred_contact_method?: 'message' | 'email' | 'phone';
  preferred_contact_time?: string;
  needed_by?: string; // YYYY-MM-DD
  budget_range?: string;
  intent?: 'inquiry' | 'offer';
  offered_rate?: number;
};

export async function createLead(providerSlug: string, payload: CreateLeadPayload): Promise<
  ApiResponse<{
    lead_uuid: string;
    conversation: any | null;
  }>
> {
  try {
    const res = await apiClient.post(`/api/mobile/providers/${encodeURIComponent(providerSlug)}/leads`, payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

