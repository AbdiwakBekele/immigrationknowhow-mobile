import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as dvApi from '../api/dvLotteryApi';

type Ctx = {
  loading: boolean;
  content: dvApi.DvLotteryContent | null;
  showInMenu: boolean;
  error: string | null;
  /** `silent`: do not show full-screen loading; keep previous content on failure (e.g. pull focus). */
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
};

const DvLotteryContext = createContext<Ctx | null>(null);

export function DvLotteryProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<dvApi.DvLotteryContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    const res = await dvApi.getDvLottery();
    if (!silent) setLoading(false);
    if (!res.success) {
      if (!silent) {
        setError(res.message);
        setContent(null);
      }
      return;
    }
    setContent(res.data.content);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const showInMenu = !!content?.show_in_menu;

  const value = useMemo(
    () => ({ loading, content, showInMenu, error, refresh }),
    [loading, content, showInMenu, error, refresh]
  );

  return <DvLotteryContext.Provider value={value}>{children}</DvLotteryContext.Provider>;
}

export function useDvLottery(): Ctx {
  const ctx = useContext(DvLotteryContext);
  if (!ctx) {
    throw new Error('useDvLottery must be used within DvLotteryProvider');
  }
  return ctx;
}
