import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ConversationItem = {
  uuid: string;
  subject: string | null;
  last_message_at: string | null;
  unread_count: number;
  latest_message?: { body: string; created_at: string } | null;
  user?: { id?: number; first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null;
  provider_user?: { id?: number; first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null;
  lead?: {
    uuid?: string;
    service_type?: string;
    service_type_label?: string;
    status?: string;
    urgency?: string | null;
    created_at?: string | null;
    contract_sent_at?: string | null;
    contract_accepted_at?: string | null;
    contract_uuid?: string | null;
  } | null;
};

export type MessageItem = {
  uuid: string;
  body: string;
  created_at: string | null;
  is_mine: boolean;
  sender?: any;
};

export async function listConversations(): Promise<ApiResponse<{ conversations: ConversationItem[] }>> {
  try {
    const res = await apiClient.get('/api/mobile/messages');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function listArchivedConversations(): Promise<ApiResponse<{ conversations: ConversationItem[] }>> {
  try {
    const res = await apiClient.get('/api/mobile/messages/archived');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getConversation(uuid: string): Promise<ApiResponse<{ conversation: ConversationItem; messages: MessageItem[] }>> {
  try {
    const res = await apiClient.get(`/api/mobile/messages/${encodeURIComponent(uuid)}`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function sendMessage(uuid: string, body: string): Promise<ApiResponse<{ message: MessageItem }>> {
  try {
    const res = await apiClient.post(`/api/mobile/messages/${encodeURIComponent(uuid)}`, { body });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function unreadCount(): Promise<ApiResponse<{ count: number }>> {
  try {
    const res = await apiClient.get('/api/mobile/messages/unread-count');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function markConversationRead(uuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/messages/${encodeURIComponent(uuid)}/read`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function archiveConversation(uuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/messages/${encodeURIComponent(uuid)}/archive`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function unarchiveConversation(uuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.post(`/api/mobile/messages/${encodeURIComponent(uuid)}/unarchive`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function deleteConversation(uuid: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const res = await apiClient.delete(`/api/mobile/messages/${encodeURIComponent(uuid)}`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

