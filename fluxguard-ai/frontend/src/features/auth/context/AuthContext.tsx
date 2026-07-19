import React, { useState, useEffect, useCallback } from 'react';
import { config } from '@/services/config';
import { authApi } from '../api/authApi';
import { AuthContext } from './authContextValue';
import {
  createDemoSession,
  demoUser,
  isDemoAccessToken,
  isDemoRefreshToken,
  isNetworkAuthFailure,
} from '../demoAuth';
import type { TokenResponse, UserProfile } from '../types';

const ACCESS_TOKEN_KEY = 'fluxguard_access_token';
const REFRESH_TOKEN_KEY = 'fluxguard_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const saveSession = useCallback((session: TokenResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    setUser(session.user);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    if (config.enableDemoAuth && isDemoRefreshToken(refreshToken)) {
      saveSession(createDemoSession());
      setIsLoading(false);
      return;
    }

    try {
      const session = await authApi.refresh(refreshToken);
      saveSession(session);
    } catch (err) {
      console.warn('Session refresh failed:', err);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, saveSession]);

  const initSession = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    if (config.enableDemoAuth && isDemoAccessToken(accessToken)) {
      setUser(demoUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe(accessToken);
      setUser(profile);
      setIsAuthenticated(true);
    } catch (err) {
      console.warn('Initializing session with access token failed. Attempting refresh.', err);
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const session = await authApi.login(email, password);
      saveSession(session);
    } catch (err) {
      if (config.enableDemoAuth && isNetworkAuthFailure(err)) {
        saveSession(createDemoSession());
        return;
      }

      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    }
  };

  const loginDemo = () => {
    saveSession(createDemoSession());
  };

  const logout = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      try {
        await authApi.logout(accessToken);
      } catch (err) {
        console.warn('API logout request failed:', err);
      }
    }
    clearSession();
  };

  const updateProfile = async (payload: {
    name?: string;
    email?: string;
    preferred_language?: string;
  }) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    try {
      const updated = await authApi.updateProfile(accessToken, payload);
      setUser(updated);
    } catch (err) {
      console.error('Update profile failed:', err);
      throw err;
    }
  };

  const changePassword = async (payload: { current_password: string; new_password: string }) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    try {
      await authApi.changePassword(accessToken, payload);
    } catch (err) {
      console.error('Change password failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        loginDemo,
        logout,
        refreshSession,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
