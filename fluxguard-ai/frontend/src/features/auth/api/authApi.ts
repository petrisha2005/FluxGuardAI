import { config } from '@/services/config';
import type { TokenResponse, UserProfile } from '../types';

const AUTH_REQUEST_TIMEOUT_MS = 5_000;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.detail?.error?.message ||
      errorData?.detail ||
      `HTTP error! status: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return response.json() as Promise<T>;
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<TokenResponse>(response);
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<UserProfile> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  logout: async (token: string): Promise<void> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    await handleResponse<{ status: string }>(response);
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<TokenResponse>(response);
  },

  getMe: async (token: string): Promise<UserProfile> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },

  updateProfile: async (
    token: string,
    payload: { name?: string; email?: string; preferred_language?: string },
  ): Promise<UserProfile> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  changePassword: async (
    token: string,
    payload: { current_password: string; new_password: string },
  ): Promise<void> => {
    const response = await authFetch(`${config.apiBaseUrl}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    await handleResponse<{ status: string }>(response);
  },
};
