import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiEnvelope, ApiError, AuthTokens } from './types';
import { tokenStore } from './tokenStore';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const http: AxiosInstance = axios.create({ baseURL });

// Attach the access token to every request.
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback invoked when auth is irrecoverably lost (e.g. refresh failed).
let onAuthLost: (() => void) | null = null;
export function setOnAuthLost(cb: () => void): void {
  onAuthLost = cb;
}

let refreshing: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error('No refresh token');
  // Uses the access token in the header (backend guards /auth/refresh with JWT).
  const res = await axios.post<ApiEnvelope<AuthTokens>>(
    `${baseURL}/auth/refresh`,
    { refreshToken },
    { headers: { Authorization: `Bearer ${tokenStore.access ?? ''}` } },
  );
  tokenStore.set(res.data.data);
  return res.data.data;
}

// On 401, try a single token refresh, then retry the original request once.
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing ??= refreshTokens();
        const tokens = await refreshing;
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http(original);
      } catch {
        tokenStore.clear();
        onAuthLost?.();
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);

/** Unwraps the backend success envelope and returns the inner `data`. */
export async function apiGet<T>(url: string): Promise<T> {
  const res = await http.get<ApiEnvelope<T>>(url);
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<ApiEnvelope<T>>(url, body);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.patch<ApiEnvelope<T>>(url, body);
  return res.data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await http.delete<ApiEnvelope<T>>(url);
  return res.data.data;
}

/** Normalizes an Axios error into a human-readable message. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Unexpected error';
}
