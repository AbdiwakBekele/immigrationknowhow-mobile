import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser, UserRole } from '../types/user';
import * as authApi from '../api/authApi';
import { friendlyApiErrorMessage } from '../api/userFriendlyMessage';
import { clearActiveRole, getActiveRole, setActiveRole as persistActiveRole } from '../services/activeRoleStorage';
import { clearToken, getToken, setToken } from '../services/tokenStorage';
import { setUnauthorizedHandler } from '../api/client';

type AuthState = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  activeRole: UserRole | null;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUp: (payload: authApi.RegisterPayload) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setActiveRole: (role: UserRole) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function inferPrimaryRole(user: AuthUser | null): UserRole | null {
  const roles = user?.roles ?? [];
  if (roles.includes('provider')) return 'provider';
  if (roles.includes('user')) return 'user';
  if (roles.includes('advertiser')) return 'advertiser';
  return roles[0] ?? null;
}

function resolveActiveRole(user: AuthUser | null, storedRole: UserRole | null): UserRole | null {
  const roles = user?.roles ?? [];
  if (storedRole && roles.includes(storedRole)) {
    return storedRole;
  }
  return inferPrimaryRole(user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signOutInProgress = useRef(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);

  const role = useMemo(() => activeRole ?? inferPrimaryRole(user), [activeRole, user]);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback(
    (target: UserRole) => {
      return (user?.roles ?? []).includes(target);
    },
    [user]
  );

  const syncActiveRole = useCallback(async (nextUser: AuthUser | null) => {
    const stored = await getActiveRole();
    const resolved = resolveActiveRole(nextUser, stored);
    setActiveRoleState(resolved);
    if (resolved) {
      await persistActiveRole(resolved);
    } else {
      await clearActiveRole();
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await authApi.me();
    if (res.success) {
      setUser(res.data.user);
      await syncActiveRole(res.data.user);
    }
  }, [syncActiveRole]);

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
    await syncActiveRole(res.data.user);
    return { ok: true as const };
  }, [syncActiveRole]);

  const signUp = useCallback(async (payload: authApi.RegisterPayload) => {
    const res = await authApi.register(payload);
    if (!res.success) return { ok: false as const, message: friendlyApiErrorMessage(res) };

    await setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data.user);
    await syncActiveRole(res.data.user);
    return { ok: true as const };
  }, [syncActiveRole]);

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
      await clearActiveRole();
      setTokenState(null);
      setUser(null);
      setActiveRoleState(null);
    } finally {
      signOutInProgress.current = false;
    }
  }, []);

  const setActiveRole = useCallback(
    async (nextRole: UserRole) => {
      if (!hasRole(nextRole)) return;
      setActiveRoleState(nextRole);
      await persistActiveRole(nextRole);
    },
    [hasRole]
  );

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
      activeRole,
      signIn,
      signUp,
      signOut,
      refreshMe,
      setActiveRole,
      hasRole,
    }),
    [isBootstrapping, isAuthenticated, token, user, role, activeRole, signIn, signUp, signOut, refreshMe, setActiveRole, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

