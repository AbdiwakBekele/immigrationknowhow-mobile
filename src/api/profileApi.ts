import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

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

export type UploadImageFile = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<{ user: unknown }>> {
  try {
    const res = await apiClient.patch('/api/mobile/profile', payload);
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function uploadAvatar(image: UploadImageFile): Promise<ApiResponse<{ user: unknown }>> {
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

export async function deleteAvatar(): Promise<ApiResponse<{ user: unknown }>> {
  try {
    const res = await apiClient.delete('/api/mobile/profile/avatar');
    return res.data;
  } catch (e) {
    return normalizeApiError(e);
  }
}
