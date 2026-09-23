import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { AuthUser, UserRole } from '../types/user';
import * as authApi from '../api/authApi';
import { friendlyApiErrorMessage } from '../api/userFriendlyMessage';
import { clearActiveRole, getActiveRole, setActiveRole as persistActiveRole } from '../services/activeRoleStorage';
import { clearGuestMode, getGuestMode, setGuestMode } from '../services/guestModeStorage';
import { clearToken, getToken, setToken } from '../services/tokenStorage';
import { setUnauthorizedHandler } from '../api/client';

type AuthState = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  activeRole: UserRole | null;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUp: (payload: authApi.RegisterPayload) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  confirmSignOut: () => void;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  refreshMe: () => Promise<void>;
  applyUser: (user: AuthUser) => void;
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
  const [isGuest, setIsGuest] = useState(false);
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
        if (stored) {
          setTokenState(stored);
          await refreshMe();
          return;
        }
        const guest = await getGuestMode();
        setIsGuest(guest);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [refreshMe]);

  const enterGuestMode = useCallback(async () => {
    await setGuestMode(true);
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(async () => {
    await clearGuestMode();
    setIsGuest(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (!res.success) return { ok: false as const, message: friendlyApiErrorMessage(res) };

    await setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data.user);
    await clearGuestMode();
    setIsGuest(false);
    await syncActiveRole(res.data.user);
    return { ok: true as const };
  }, [syncActiveRole]);

  const signUp = useCallback(async (payload: authApi.RegisterPayload) => {
    const res = await authApi.register(payload);
    if (!res.success) return { ok: false as const, message: friendlyApiErrorMessage(res) };

    await setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data.user);
    await clearGuestMode();
    setIsGuest(false);
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
      await clearGuestMode();
      setTokenState(null);
      setUser(null);
      setActiveRoleState(null);
      setIsGuest(false);
    } finally {
      signOutInProgress.current = false;
    }
  }, []);

  const confirmSignOut = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }, [signOut]);

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
      isGuest,
      token,
      user,
      role,
      activeRole,
      signIn,
      signUp,
      signOut,
      confirmSignOut,
      enterGuestMode,
      exitGuestMode,
      refreshMe,
      applyUser,
      setActiveRole,
      hasRole,
    }),
    [isBootstrapping, isAuthenticated, isGuest, token, user, role, activeRole, signIn, signUp, signOut, confirmSignOut, enterGuestMode, exitGuestMode, refreshMe, applyUser, setActiveRole, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

