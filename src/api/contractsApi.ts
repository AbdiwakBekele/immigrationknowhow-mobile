import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ContractItem = {
  uuid: string;
  state: string;
  offered_rate: string | number | null;
  agreed_rate: string | number | null;
  offered_at: string | null;
  accepted_at: string | null;
  ended_at: string | null;
  lead: null | {
    uuid: string;
    status: string;
    service_type: string;
    message: string;
    contract_sent_at: string | null;
    contract_accepted_at: string | null;
  };
  provider: null | {
    slug: string;
    business_name: string | null;
  };
};

export async function listContracts(): Promise<
  ApiResponse<{
    contracts: { data: ContractItem[] };
  }>
> {
  try {
    const res = await apiClient.get('/api/mobile/contracts');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getContract(uuid: string): Promise<ApiResponse<{ contract: ContractItem; events: any[] }>> {
  try {
    const res = await apiClient.get(`/api/mobile/contracts/${encodeURIComponent(uuid)}`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function sendContract(leadUuid: string, offered_rate?: number): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/contracts/lead/${encodeURIComponent(leadUuid)}/send`, {
      offered_rate,
    });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function withdrawContract(leadUuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/contracts/lead/${encodeURIComponent(leadUuid)}/withdraw`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function endContract(leadUuid: string, reason?: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/contracts/lead/${encodeURIComponent(leadUuid)}/end`, { reason });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function acceptContract(contractUuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/contracts/${encodeURIComponent(contractUuid)}/accept`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

