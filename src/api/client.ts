import axios, { AxiosError, isAxiosError } from 'axios';
import { BASE_URL } from '../config/api';
import type { ApiError } from './types';
import { getToken } from '../services/tokenStorage';

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (__DEV__) {
    const u = `${config.baseURL ?? ''}${config.url ?? ''}`;
    console.log(`[API] → ${String(config.method ?? 'get').toUpperCase()} ${u}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    if (__DEV__) {
      const cfg = res.config;
      const u = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
      console.log(`[API] ← ${res.status} ${u}`);
    }
    return res;
  },
  async (error) => {
    if (__DEV__ && isAxiosError(error)) {
      const cfg = error.config;
      const u = cfg ? `${cfg.baseURL ?? ''}${cfg.url ?? ''}` : '';
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`[API] ✗ ${status ?? '??'} ${u}`, data ?? error.message);
    }
    const status = error?.response?.status;
    const reqPath = String(error?.config?.url ?? '');
    // Avoid re-entry: duplicate logout or 401 after session already revoked.
    const isLogoutRequest = reqPath.includes('auth/logout');
    if (status === 401 && unauthorizedHandler && !isLogoutRequest) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const data = axiosError.response?.data;
    if (data && typeof data === 'object' && typeof data.success === 'boolean') {
      return {
        success: false,
        message: typeof data.message === 'string' ? data.message : 'Request failed',
        errors: data.errors,
      };
    }

    const serverMessage =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : undefined;

    return {
      success: false,
      message: serverMessage ?? axiosError.message ?? 'Network request failed',
    };
  }

  return { success: false, message: 'Unexpected error' };
}

