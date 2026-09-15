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
  SESSION_SUPERSEDED_EVENT,
} from '@/app/lib/api';
import type { AuthUser, TokenResponse } from '@/app/lib/types/auth';
import type { LoginFormData, SignupFormData } from '@/app/lib/validations/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Set right after the session-superseded event fires — a page can show
   * this once, then it clears itself; not persisted anywhere. */
  loggedOutReason: string | null;
  clearLoggedOutReason: () => void;
  signup: (data: SignupFormData) => Promise<AuthUser>;
  login: (data: LoginFormData & { rememberMe?: boolean }) => Promise<AuthUser>;
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
  const [loggedOutReason, setLoggedOutReason] = useState<string | null>(null);

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

  // The backend invalidates every other session the moment one device logs
  // in — this listens for the resulting 401 (flagged via a response header
  // in app/lib/api.ts, since ordinary API calls all over the app hit this
  // same case and most of them just swallow errors silently) and forces a
  // clean logout with an explanation, rather than leaving the UI in a
  // half-authenticated state until the next manual action fails too.
  useEffect(() => {
    const handleSuperseded = () => {
      setUser(null);
      setLoggedOutReason('You were logged out because your account was signed in on another device.');
    };
    window.addEventListener(SESSION_SUPERSEDED_EVENT, handleSuperseded);
    return () => window.removeEventListener(SESSION_SUPERSEDED_EVENT, handleSuperseded);
  }, []);

  const signup = useCallback(async (data: SignupFormData) => {
    const result = await apiPost<TokenResponse>(
      '/api/v1/auth/signup',
      { email: data.email, password: data.password, role: data.role },
      { auth: false }
    );
    setStoredAuthToken(result.access_token, true);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (data: LoginFormData & { rememberMe?: boolean }) => {
    const result = await apiPost<TokenResponse>(
      '/api/v1/auth/login',
      { email: data.email, password: data.password },
      { auth: false }
    );
    setStoredAuthToken(result.access_token, data.rememberMe ?? true);
    setUser(result.user);
    return result.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, role?: 'founder' | 'investor') => {
    const result = await apiPost<TokenResponse>(
      '/api/v1/auth/google',
      { id_token: idToken, role },
      { auth: false }
    );
    setStoredAuthToken(result.access_token, true);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthToken();
    setUser(null);
  }, []);

  const clearLoggedOutReason = useCallback(() => setLoggedOutReason(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      loggedOutReason,
      clearLoggedOutReason,
      signup,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, loggedOutReason, clearLoggedOutReason, signup, login, loginWithGoogle, logout]
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
