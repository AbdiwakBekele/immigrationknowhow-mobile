import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';
import type { AuthUser } from '../types/user';

export type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  preferred_language?: string | null;
};

export type ProviderProfile = {
  id: number;
  slug?: string;
  business_name?: string | null;
  tagline?: string | null;
  bio?: string | null;
  description?: string | null;
  website?: string | null;
  service_types?: string[];
  specializations?: string[];
  languages_offered?: string[];
  pricing_model?: string | null;
  hourly_rate?: string | number | null;
  consultation_fee?: string | number | null;
  free_consultation?: boolean;
  serves_remote?: boolean;
  serves_in_person?: boolean;
  service_areas?: string[];
  years_experience?: number | null;
  average_rating?: string | number | null;
  total_reviews?: number | null;
  is_featured?: boolean;
  is_favorited?: boolean;
  accepting_clients?: boolean;
  background_check_status?: string | null;
  profile_views?: number | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  stripe_subscription_status?: string | null;
  location_display?: string | null;
};

export type ProviderProfilePayload = {
  business_name: string;
  tagline?: string | null;
  bio?: string | null;
  website?: string | null;
  years_experience?: number | null;
  hourly_rate?: number | null;
  specializations?: string[];
  service_areas?: string[];
};

export type MobileProfileData = {
  user: AuthUser;
  provider: ProviderProfile | null;
};

export type UploadImageFile = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export async function getProfile(): Promise<ApiResponse<MobileProfileData>> {
  try {
    const res = await apiClient.get('/api/mobile/profile');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const res = await apiClient.patch('/api/mobile/profile', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function updateProviderProfile(payload: ProviderProfilePayload): Promise<ApiResponse<MobileProfileData>> {
  try {
    const res = await apiClient.patch('/api/mobile/provider/profile', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function uploadAvatar(image: UploadImageFile): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const form = new FormData();
    if (image.file) {
      form.append('avatar', image.file, image.name);
    } else {
      form.append('avatar', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as unknown as Blob);
    }
    const res = await apiClient.post('/api/mobile/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function deleteAvatar(): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const res = await apiClient.delete('/api/mobile/profile/avatar');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
