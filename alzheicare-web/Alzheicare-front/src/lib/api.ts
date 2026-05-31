export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

let refreshPromise: Promise<string | null> | null = null;

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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(joinUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const raw = await response.text();
  const payload = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) || response.statusText || 'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function apiRequestWithAuth<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const initialToken = resolveAccessToken(token);

  let response = await fetch(joinUrl(path), {
    ...init,
    headers: buildHeaders(init.headers, initialToken),
  });

  if (response.status === 401 && initialToken) {
    const refreshedAccessToken = await refreshAccessToken();

    if (refreshedAccessToken) {
      response = await fetch(joinUrl(path), {
        ...init,
        headers: buildHeaders(init.headers, refreshedAccessToken),
      });
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

function buildHeaders(
  headers: HeadersInit | undefined,
  token?: string | null,
): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };
}

function resolveAccessToken(explicitToken?: string | null) {
  const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (storedToken) {
    return storedToken;
  }

  if (explicitToken) {
    return explicitToken;
  }

  return null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(joinUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthStorage();
        return null;
      }

      const payload = (await response.json()) as Partial<AuthTokens>;
      if (!payload.accessToken || !payload.refreshToken) {
        clearAuthStorage();
        return null;
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);

      return payload.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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