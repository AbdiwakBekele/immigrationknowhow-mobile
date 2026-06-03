import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { API_DETAILED_LOGS, BASE_URL } from '../config/api';
import { logTerminalError } from '../utils/terminalErrorLog';
import type { ApiError } from './types';
import { getActiveRole } from '../services/activeRoleStorage';
import { getToken } from '../services/tokenStorage';

type ConfigWithTimer = InternalAxiosRequestConfig & { __apiLogStart?: number };

let unauthorizedHandler: (() => void) | null = null;

function summarizeForLog(value: unknown, maxLen = 600): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') {
    const oneLine = value.replace(/\s+/g, ' ').trim();
    return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}… (${value.length} chars)` : oneLine;
  }
  try {
    const s = JSON.stringify(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}… (${s.length} chars)` : s;
  } catch {
    return String(value).slice(0, maxLen);
  }
}

function requestUrl(cfg: InternalAxiosRequestConfig): string {
  const base = cfg.baseURL ?? '';
  const path = cfg.url ?? '';
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function logRequestDetail(cfg: ConfigWithTimer, hasAuth: boolean) {
  const method = String(cfg.method ?? 'get').toUpperCase();
  const url = requestUrl(cfg);
  const params = cfg.params && typeof cfg.params === 'object' && Object.keys(cfg.params as object).length > 0
    ? summarizeForLog(cfg.params, 400)
    : '—';
  const body = cfg.data != null && cfg.data !== '' ? summarizeForLog(cfg.data, 500) : '—';
  console.log(
    `[API] ┌── ${method} ${url}\n` +
      `│ baseURL: ${cfg.baseURL ?? '(none)'}\n` +
      `│ path:    ${cfg.url ?? '(none)'}\n` +
      `│ params:  ${params}\n` +
      `│ body:    ${body}\n` +
      `│ auth:    ${hasAuth ? 'Bearer <present>' : 'none'}`
  );
}

function logResponseOk(cfg: ConfigWithTimer, status: number, contentType: string | undefined) {
  const url = requestUrl(cfg);
  const start = cfg.__apiLogStart;
  const ms = typeof start === 'number' ? Date.now() - start : undefined;
  console.log(
    `[API] └── ${status} ${url}${ms != null ? ` | ${ms}ms` : ''}${contentType ? ` | ${contentType}` : ''}`
  );
}

function logResponseError(err: AxiosError) {
  const cfg = err.config as ConfigWithTimer | undefined;
  const url = cfg ? requestUrl(cfg) : '(unknown url)';
  const start = cfg?.__apiLogStart;
  const ms = typeof start === 'number' ? Date.now() - start : undefined;
  const status = err.response?.status;
  const code = err.code;
  const msg = err.message;
  const raw = err.response?.data;
  let preview = '';
  if (raw !== undefined) {
    if (typeof raw === 'string') {
      preview = summarizeForLog(raw, 800);
    } else if (typeof raw === 'object') {
      preview = summarizeForLog(raw, 800);
    } else {
      preview = String(raw);
    }
  } else {
    preview = '(no response body)';
  }
  const summary =
    `[API] └── ERROR ${status ?? '??'} ${url}${ms != null ? ` | ${ms}ms` : ''}\n` +
    `│ code:    ${code ?? '—'}\n` +
    `│ message: ${msg}\n` +
    `│ body:    ${preview}`;
  console.error(summary);
  const apiMessage =
    typeof raw === 'object' && raw !== null && 'message' in raw && typeof (raw as { message?: unknown }).message === 'string'
      ? (raw as { message: string }).message
      : undefined;
  logTerminalError('API REQUEST FAILED', new Error(apiMessage ?? msg), {
    status: status ?? 'unknown',
    url,
    code: code ?? '—',
    ms: ms ?? '—',
    ...(apiMessage ? { apiMessage } : {}),
  });
}

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
  const activePortal = await getActiveRole();
  if (activePortal === 'user' || activePortal === 'provider') {
    config.headers = config.headers ?? {};
    config.headers['X-Active-Portal'] = activePortal;
  }
  if (Platform.OS === 'ios') {
    config.headers = config.headers ?? {};
    config.headers['X-IKH-Client'] = 'ios';
  } else if (Platform.OS === 'android') {
    config.headers = config.headers ?? {};
    config.headers['X-IKH-Client'] = 'android';
  }
  if (__DEV__) {
    const c = config as ConfigWithTimer;
    c.__apiLogStart = Date.now();
    const u = requestUrl(c);
    const method = String(c.method ?? 'get').toUpperCase();
    if (API_DETAILED_LOGS) {
      logRequestDetail(c, !!token);
    } else {
      console.log(`[API] → ${method} ${u}`);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    if (__DEV__) {
      const cfg = res.config as ConfigWithTimer;
      if (API_DETAILED_LOGS) {
        const ct = res.headers['content-type'];
        logResponseOk(cfg, res.status, typeof ct === 'string' ? ct : undefined);
      } else {
        console.log(`[API] ← ${res.status} ${requestUrl(cfg)}`);
      }
    }
    return res;
  },
  async (error) => {
    if (__DEV__ && isAxiosError(error)) {
      if (API_DETAILED_LOGS) {
        logResponseError(error);
      } else {
        const cfg = error.config;
        const u = cfg ? requestUrl(cfg as ConfigWithTimer) : '';
        const status = error.response?.status;
        const data = error.response?.data;
        const message = typeof data === 'object' && data && 'message' in data
          ? String((data as { message?: unknown }).message)
          : error.message;
        console.error(`[API] ✗ ${status ?? '??'} ${u}`, data ?? error.message);
        logTerminalError('API REQUEST FAILED', new Error(message), {
          status: status ?? 'unknown',
          url: u,
        });
      }
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

    const status = axiosError.response?.status;

    const serverMessage =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : undefined;

    const gatewayMessage =
      status === 502 || status === 503 || status === 504
        ? 'The server is temporarily unavailable. Please try again in a moment.'
        : undefined;

    const isTimeout =
      axiosError.code === 'ECONNABORTED' ||
      /timeout/i.test(axiosError.message ?? '');
    const networkMessage = isTimeout
      ? 'Could not reach the server. Check that Laravel Herd is running and that the API URL in src/config/api.ts is reachable from this device.'
      : undefined;

    return {
      success: false,
      message: serverMessage ?? gatewayMessage ?? networkMessage ?? axiosError.message ?? 'Network request failed',
      errors: data?.errors,
    };
  }

  return { success: false, message: 'Unexpected error' };
}

