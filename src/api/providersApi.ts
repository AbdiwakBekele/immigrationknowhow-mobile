import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { ProviderDetail, ProviderListItem } from '../types/provider';

export type ProvidersQuery = {
  service_type?: string;
  language?: string;
  location?: string;
  search?: string;
  favorites?: boolean;
  remote_only?: boolean;
  free_consultation?: boolean;
  sort?: 'rating' | 'reviews' | 'newest' | 'experience';
  page?: number;
  per_page?: number;
};

export async function listProviders(query: ProvidersQuery = {}): Promise<
  ApiResponse<{
    providers: {
      data: ProviderListItem[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>
> {
  try {
    const res = await apiClient.get('/api/mobile/providers', { params: query });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getProvider(slug: string): Promise<
  ApiResponse<{
    provider: ProviderDetail;
    canContactProvider: boolean;
    isOwnListingPreview: boolean;
    canFavoriteProvider: boolean;
    isFavorited: boolean;
  }>
> {
  try {
    const res = await apiClient.get(`/api/mobile/providers/${encodeURIComponent(slug)}`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function toggleFavorite(slug: string): Promise<ApiResponse<{ favorited: boolean }>> {
  try {
    const res = await apiClient.post(`/api/mobile/providers/${encodeURIComponent(slug)}/favorite`);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

