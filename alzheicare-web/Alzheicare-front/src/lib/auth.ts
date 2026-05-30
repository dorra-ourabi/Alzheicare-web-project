export type AppRole = 'doctor' | 'caregiver';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  username: string;
  role: AppRole;
  email?: string;
  firstName?: string;
  secondName?: string;
  backendRole?: string;
};

type JwtPayload = {
  sub?: string | number;
  username?: string;
  role?: string;
  email?: string;
  firstName?: string;
  secondName?: string;
};

export function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function mapBackendRole(role?: string | null): AppRole {
  return role === 'Doctor' ? 'doctor' : 'caregiver';
}

export function buildAuthUser(
  token: string,
  fallback: Partial<AuthUser> = {},
): AuthUser {
  const payload = decodeJwtPayload(token) ?? {};
  const backendRole = payload.role ?? fallback.backendRole ?? 'Patient';
  const username = payload.username ?? fallback.username ?? fallback.email ?? 'user';

  return {
    id: String(payload.sub ?? fallback.id ?? username),
    username,
    email: payload.email ?? fallback.email,
    firstName: payload.firstName ?? fallback.firstName,
    secondName: payload.secondName ?? fallback.secondName,
    backendRole,
    role: mapBackendRole(backendRole),
  };
}