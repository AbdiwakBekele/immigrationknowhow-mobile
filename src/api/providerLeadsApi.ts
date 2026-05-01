import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ProviderLead = {
  id: number;
  uuid: string;
  status: string;
  service_type: string;
  message: string;
  urgency: string;
  created_at: string | null;
  user: null | {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  conversation: null | { uuid: string };
};

export async function listProviderLeads(params?: {
  status?: string;
  urgency?: string;
  search?: string;
}): Promise<
  ApiResponse<{
    leads: { data: ProviderLead[] };
    stats: Record<string, string | number>;
    filters: Record<string, unknown>;
  }>
> {
  try {
    const res = await apiClient.get('/api/mobile/provider/leads', { params });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getProviderLead(uuid: string): Promise<
  ApiResponse<{
    lead: ProviderLead;
    activity_log: Array<{ id: string; type: string; description: string; created_at: string | null }>;
  }>
> {
  try {
    const res = await apiClient.get(`/api/mobile/provider/leads/${encodeURIComponent(uuid)}`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function updateLeadStatus(uuid: string, status: string): Promise<ApiResponse<{ lead: ProviderLead }>> {
  try {
    const res = await apiClient.patch(`/api/mobile/provider/leads/${encodeURIComponent(uuid)}/status`, { status });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function addLeadNote(uuid: string, note: string): Promise<ApiResponse<{ lead: ProviderLead }>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/leads/${encodeURIComponent(uuid)}/notes`, { note });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function createLeadConversation(uuid: string): Promise<ApiResponse<{ conversation_uuid: string }>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/leads/${encodeURIComponent(uuid)}/conversation`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function declineLead(uuid: string, reason?: string): Promise<ApiResponse<{ lead: ProviderLead }>> {
  try {
    const res = await apiClient.post(`/api/mobile/provider/leads/${encodeURIComponent(uuid)}/decline`, { reason });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
