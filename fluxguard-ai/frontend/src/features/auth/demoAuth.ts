import type { TokenResponse, UserProfile } from './types';

export const DEMO_ACCESS_TOKEN = 'fluxguard-demo-access-token';
export const DEMO_REFRESH_TOKEN = 'fluxguard-demo-refresh-token';

export const demoUser: UserProfile = {
  id: 'demo-operator',
  name: 'Demo Operations Director',
  email: 'operator@fluxguard.demo',
  role: 'SUPER_ADMIN',
  preferred_language: 'en',
  is_active: true,
  is_verified: true,
};

export const demoDirectoryUsers: UserProfile[] = [
  demoUser,
  {
    id: 'demo-safety-supervisor',
    name: 'Avery Chen',
    email: 'safety.supervisor@fluxguard.demo',
    role: 'SECURITY_SUPERVISOR',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
  },
  {
    id: 'demo-stadium-manager',
    name: 'Maya Rodriguez',
    email: 'stadium.manager@fluxguard.demo',
    role: 'STADIUM_MANAGER',
    preferred_language: 'es',
    is_active: true,
    is_verified: true,
  },
  {
    id: 'demo-volunteer-lead',
    name: 'Jordan Patel',
    email: 'volunteer.lead@fluxguard.demo',
    role: 'VOLUNTEER_COORDINATOR',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
  },
  {
    id: 'demo-viewer-disabled',
    name: 'Read Only Analyst',
    email: 'analyst.disabled@fluxguard.demo',
    role: 'VIEWER',
    preferred_language: 'fr',
    is_active: false,
    is_verified: true,
  },
];

export function createDemoSession(): TokenResponse {
  return {
    access_token: DEMO_ACCESS_TOKEN,
    refresh_token: DEMO_REFRESH_TOKEN,
    token_type: 'bearer',
    role: demoUser.role,
    user: demoUser,
  };
}

export function isDemoAccessToken(token: string | null): boolean {
  return token === DEMO_ACCESS_TOKEN;
}

export function isDemoRefreshToken(token: string | null): boolean {
  return token === DEMO_REFRESH_TOKEN;
}

export function isNetworkAuthFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'TypeError' ||
    error.name === 'AbortError' ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  );
}
