export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../context/auth-context'

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function joinUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function persistAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.dispatchEvent(
    new CustomEvent('auth:tokens-updated', {
      detail: { accessToken, refreshToken },
    }),
  );
}

function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('auth:tokens-updated'));
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(joinUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthTokens();
    return null;
  }

  const payload = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  persistAuthTokens(payload.accessToken, payload.refreshToken);
  return payload.accessToken;
}

function getRequestHeaders(init: RequestInit, token?: string | null) {
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const requestInit = {
    ...init,
    headers: getRequestHeaders(init, getStoredAccessToken()),
  };

  const response = await fetch(joinUrl(path), requestInit);

  if (response.status === 401 && !path.startsWith('/auth/refresh')) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      const retryResponse = await fetch(joinUrl(path), {
        ...init,
        headers: getRequestHeaders(init, refreshedToken),
      });

      const retryRaw = await retryResponse.text();
      const retryPayload = retryRaw ? safeJsonParse(retryRaw) : null;

      if (!retryResponse.ok) {
        const message =
          extractErrorMessage(retryPayload) || retryResponse.statusText || 'Request failed';
        throw new ApiError(message, retryResponse.status, retryPayload);
      }

      return retryPayload as T;
    }
  }

  const raw = await response.text();
  const payload = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) || response.statusText || 'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.message === 'string') {
    return candidate.message;
  }

  if (Array.isArray(candidate.message) && typeof candidate.message[0] === 'string') {
    return candidate.message[0];
  }

  return null;
}