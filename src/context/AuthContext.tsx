import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser, UserRole } from '../types/user';
import * as authApi from '../api/authApi';
import { friendlyApiErrorMessage } from '../api/userFriendlyMessage';
import { clearToken, getToken, setToken } from '../services/tokenStorage';
import { setUnauthorizedHandler } from '../api/client';

type AuthState = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUp: (payload: authApi.RegisterPayload) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  applyUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function inferPrimaryRole(user: AuthUser | null): UserRole | null {
  const roles = user?.roles ?? [];
  if (roles.includes('provider')) return 'provider';
  if (roles.includes('user')) return 'user';
  if (roles.includes('advertiser')) return 'advertiser';
  return roles[0] ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signOutInProgress = useRef(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const role = useMemo(() => inferPrimaryRole(user), [user]);

  const isAuthenticated = !!token && !!user;

  const refreshMe = useCallback(async () => {
    const res = await authApi.me();
    if (res.success) {
      setUser(res.data.user);
    }
  }, []);

  const applyUser = useCallback((next: AuthUser) => {
    setUser(next);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (!stored) return;
        setTokenState(stored);
        await refreshMe();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (!res.success) return { ok: false as const, message: friendlyApiErrorMessage(res) };

    await setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data.user);
    return { ok: true as const };
  }, []);

  const signUp = useCallback(async (payload: authApi.RegisterPayload) => {
    const res = await authApi.register(payload);
    if (!res.success) return { ok: false as const, message: friendlyApiErrorMessage(res) };

    await setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data.user);
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    if (signOutInProgress.current) return;
    signOutInProgress.current = true;
    try {
      try {
        await authApi.logout();
      } catch {
        // ignore
      }
      await clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      signOutInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  const value: AuthContextValue = useMemo(
    () => ({
      isBootstrapping,
      isAuthenticated,
      token,
      user,
      role,
      signIn,
      signUp,
      signOut,
      refreshMe,
      applyUser,
    }),
    [isBootstrapping, isAuthenticated, token, user, role, signIn, signUp, signOut, refreshMe, applyUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

