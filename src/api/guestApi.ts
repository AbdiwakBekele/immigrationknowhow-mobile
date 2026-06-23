import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

export type GuestLibraryItem = {
  slug: string;
  title: string;
  cover_image_url?: string | null;
  category?: { name?: string; slug?: string } | null;
  countries?: string[];
};

export type GuestProviderItem = {
  slug: string;
  avatar_url?: string | null;
  business_type: string;
  location: string;
};

export type GuestMeta = {
  service_types: Array<{ value: string; label: string }>;
  language_options: Array<{ value: string; label: string }>;
  library_categories: Array<{ id: number; name: string; slug: string }>;
  library_regions: Array<{ value: string; label: string }>;
};

export type GuestHowItWorks = {
  title: string;
  steps: Array<{ title: string; description: string }>;
};

export async function getGuestMeta(): Promise<ApiResponse<GuestMeta>> {
  try {
    const res = await apiClient.get('/api/mobile/guest/meta');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getHowItWorks(): Promise<ApiResponse<GuestHowItWorks>> {
  try {
    const res = await apiClient.get('/api/mobile/guest/how-it-works');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function browseGuestLibrary(
  params: Record<string, unknown> = {},
): Promise<
  ApiResponse<{
    items: { data: GuestLibraryItem[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
    categories: Array<{ id: number; name: string; slug: string }>;
    regions: Array<{ value: string; label: string }>;
  }>
> {
  try {
    const res = await apiClient.get('/api/mobile/guest/library', { params });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function listGuestProviders(
  query: Record<string, unknown> = {},
): Promise<
  ApiResponse<{
    providers: {
      data: GuestProviderItem[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
  }>
> {
  try {
    const res = await apiClient.get('/api/mobile/guest/providers', { params: query });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
