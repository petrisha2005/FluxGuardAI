import { createContext } from 'react';
import type { TokenResponse, UserProfile } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    email?: string;
    preferred_language?: string;
  }) => Promise<void>;
  changePassword: (payload: { current_password: string; new_password: string }) => Promise<void>;
}

export type { TokenResponse };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
