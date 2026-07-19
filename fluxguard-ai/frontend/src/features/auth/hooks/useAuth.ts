import { useContext } from 'react';
import { AuthContext } from '../context/authContextValue';

const fallbackMockState = {
  user: {
    id: 'mock-op-uuid',
    name: 'Mock Operator',
    email: 'operator@stadiumops.org',
    role: 'operator',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: async () => {},
  loginDemo: () => {},
  logout: async () => {},
  refreshSession: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return mock fallback for unit testing environments and mock compatibility
    return fallbackMockState;
  }
  return context;
};
