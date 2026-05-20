import React, { createContext, useContext, useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  ADVERTISER_PAGE_PADDING,
  DRAWER_MAX_WIDTH,
  STRICT_MOBILE_MAX_WIDTH,
} from '../theme/responsive';

export type AdvertiserLayoutMetrics = {
  windowWidth: number;
  frameWidth: number;
  contentWidth: number;
  paddingX: number;
  drawerWidth: number;
  isCompact: boolean;
  stackActions: boolean;
  heroTitleSize: number;
  statCardMinWidthPercent: string;
};

const AdvertiserLayoutContext = createContext<AdvertiserLayoutMetrics | null>(null);

export function AdvertiserLayoutProvider({ children }: { children: React.ReactNode }) {
  const { width: windowWidth, height } = useWindowDimensions();

  const value = useMemo((): AdvertiserLayoutMetrics => {
    const frameWidth = Math.min(windowWidth, STRICT_MOBILE_MAX_WIDTH);
    const paddingX = ADVERTISER_PAGE_PADDING;
    const contentWidth = Math.max(0, frameWidth - paddingX * 2);
    const isCompact = frameWidth < 400;

    return {
      windowWidth,
      frameWidth,
      contentWidth,
      paddingX,
      drawerWidth: Math.min(DRAWER_MAX_WIDTH, Math.round(frameWidth * 0.88)),
      isCompact,
      stackActions: true,
      heroTitleSize: isCompact ? 20 : 24,
      statCardMinWidthPercent: isCompact ? '100%' : '47%',
    };
  }, [windowWidth, height]);

  return <AdvertiserLayoutContext.Provider value={value}>{children}</AdvertiserLayoutContext.Provider>;
}

export function useAdvertiserLayout(): AdvertiserLayoutMetrics {
  const ctx = useContext(AdvertiserLayoutContext);
  const { width: windowWidth, height } = useWindowDimensions();

  return useMemo(() => {
    if (ctx) return ctx;

    const frameWidth = Math.min(windowWidth, STRICT_MOBILE_MAX_WIDTH);
    const paddingX = ADVERTISER_PAGE_PADDING;
    const isCompact = frameWidth < 400;

    return {
      windowWidth,
      frameWidth,
      contentWidth: Math.max(0, frameWidth - paddingX * 2),
      paddingX,
      drawerWidth: Math.min(DRAWER_MAX_WIDTH, Math.round(frameWidth * 0.88)),
      isCompact,
      stackActions: true,
      heroTitleSize: isCompact ? 20 : 24,
      statCardMinWidthPercent: isCompact ? '100%' : '47%',
    };
  }, [ctx, windowWidth, height]);
}

/** Reusable flex styles for advertiser screens. */
export function useAdvertiserStyles() {
  const { paddingX, contentWidth } = useAdvertiserLayout();

  return useMemo(
    () => ({
      page: {
        flex: 1,
        width: '100%' as const,
        maxWidth: '100%' as const,
        paddingHorizontal: paddingX,
        overflow: 'hidden' as const,
      },
      scroll: {
        flex: 1,
        width: '100%' as const,
        maxWidth: '100%' as const,
      },
      scrollContent: {
        flexGrow: 1,
        width: '100%' as const,
        maxWidth: '100%' as const,
        paddingBottom: 32,
      },
      card: {
        width: '100%' as const,
        maxWidth: '100%' as const,
        alignSelf: 'stretch' as const,
      },
      contentWidth,
    }),
    [paddingX, contentWidth]
  );
}
