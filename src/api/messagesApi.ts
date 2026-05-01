import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type ConversationItem = {
  uuid: string;
  subject: string | null;
  last_message_at: string | null;
  unread_count: number;
  latest_message?: { body: string; created_at: string } | null;
  user?: any;
  provider_user?: any;
  lead?: any;
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

