import React, { createContext, useContext, useMemo } from 'react';

type GuestActions = {
  goSignIn: () => void;
  goSignUp: () => void;
};

const GuestActionsContext = createContext<GuestActions | null>(null);

export function GuestActionsProvider({ children, goSignIn, goSignUp }: GuestActions & { children: React.ReactNode }) {
  const value = useMemo(() => ({ goSignIn, goSignUp }), [goSignIn, goSignUp]);
  return <GuestActionsContext.Provider value={value}>{children}</GuestActionsContext.Provider>;
}

export function useGuestActions(): GuestActions {
  const ctx = useContext(GuestActionsContext);
  if (!ctx) {
    throw new Error('useGuestActions must be used within GuestActionsProvider');
  }
  return ctx;
}
