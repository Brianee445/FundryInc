'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiGet,
  apiPost,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/app/lib/api';
import type { AuthUser, TokenResponse } from '@/app/lib/types/auth';
import type { LoginFormData, SignupFormData } from '@/app/lib/validations/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (data: SignupFormData) => Promise<AuthUser>;
  login: (data: LoginFormData) => Promise<AuthUser>;
  /** `role` is only required the first time this Google account signs in — see routers/auth.py `google_auth`. */
  loginWithGoogle: (idToken: string, role?: 'founder' | 'investor') => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Starts true so pages don't briefly flash a "logged out" state while we
  // check for a persisted session on first load.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    // A stored token doesn't mean it's still valid — it may have expired, or
    // the account may have been suspended since. Confirm against /me rather
    // than trusting local storage blindly.
    apiGet<AuthUser>('/api/v1/auth/me')
      .then(setUser)
      .catch(() => clearStoredAuthToken())
      .finally(() => setIsLoading(false));
  }, []);

  const signup = useCallback(async (data: SignupFormData) => {
    const result = await apiPost<TokenResponse>('/api/v1/auth/signup', data, { auth: false });
    setStoredAuthToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (data: LoginFormData) => {
    const result = await apiPost<TokenResponse>('/api/v1/auth/login', data, { auth: false });
    setStoredAuthToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, role?: 'founder' | 'investor') => {
    const result = await apiPost<TokenResponse>(
      '/api/v1/auth/google',
      { id_token: idToken, role },
      { auth: false }
    );
    setStoredAuthToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, signup, login, loginWithGoogle, logout }),
    [user, isLoading, signup, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
