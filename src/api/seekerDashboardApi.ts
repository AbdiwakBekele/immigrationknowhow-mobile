import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { ProviderListItem } from '../types/provider';

export type SeekerLibraryItem = {
  uuid: string;
  slug: string;
  title?: string;
  author?: string | null;
  type?: string;
  cover_image_url?: string | null;
  is_premium?: boolean;
  price?: number | null;
  currency?: string | null;
};

export type SeekerPurchasedItem = {
  access_id?: number;
  purchased_at?: string | null;
  purchase_amount?: number | string | null;
  purchase_currency?: string | null;
  item?: {
    uuid?: string;
    slug?: string;
    title?: string;
    author?: string | null;
    type?: string;
    cover_image_url?: string | null;
    price?: number | null;
    currency?: string | null;
  };
};

export type SeekerDashboardLead = {
  uuid: string;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  service_type?: string;
  service_provider?: { slug?: string; business_name?: string | null };
  conversation?: { uuid: string } | null;
};

export type SeekerDashboardData = {
  stats: {
    totalLeads: number;
    unreadMessages: number;
    profileCompletion: number;
    preferredLanguageLabel?: string | null;
  };
  recent_leads: SeekerDashboardLead[];
  recent_messages: Array<{
    uuid: string;
    subject: string | null;
    last_message_at: string | null;
    latest_message?: {
      body: string;
      created_at: string | null;
    } | null;
    provider_user?: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
  recommended_providers: ProviderListItem[];
  saved_providers: ProviderListItem[];
  library_items: SeekerLibraryItem[];
  purchased_items: SeekerPurchasedItem[];
};

export async function getSeekerDashboard(): Promise<ApiResponse<{ dashboard: SeekerDashboardData }>> {
  try {
    const res = await apiClient.get('/api/mobile/seeker/dashboard');
    return {
      success: true,
      message: res.data?.message ?? 'OK',
      data: { dashboard: res.data?.data as SeekerDashboardData },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}
