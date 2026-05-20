import React, { createContext, useContext, useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  BREAKPOINTS,
  DRAWER_MAX_WIDTH,
  getAdvertiserFrameWidth,
} from '../theme/responsive';
import { spacing } from '../theme/spacing';

export type AdvertiserLayoutMetrics = {
  windowWidth: number;
  windowHeight: number;
  frameWidth: number;
  contentWidth: number;
  paddingX: number;
  drawerWidth: number;
  isWeb: boolean;
  isCompact: boolean;
  isMediumUp: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  stackActions: boolean;
  heroTitleSize: number;
  statCardMinWidthPercent: string;
  listColumns: number;
};

const AdvertiserLayoutContext = createContext<AdvertiserLayoutMetrics | null>(null);

function computeMetrics(windowWidth: number, windowHeight: number): AdvertiserLayoutMetrics {
  const frameWidth = getAdvertiserFrameWidth(windowWidth);
  const isWeb = Platform.OS === 'web';
  const isCompact = frameWidth < BREAKPOINTS.compact;
  const isMediumUp = windowWidth >= BREAKPOINTS.medium;
  const isTablet = windowWidth >= BREAKPOINTS.tablet;
  const isDesktop = windowWidth >= BREAKPOINTS.desktop;

  const paddingX = isCompact ? spacing.sm : isTablet ? spacing['2xl'] : spacing.lg;
  const contentWidth = Math.max(0, frameWidth - paddingX * 2);

  return {
    windowWidth,
    windowHeight,
    frameWidth,
    contentWidth,
    paddingX,
    drawerWidth: Math.min(DRAWER_MAX_WIDTH, Math.round(frameWidth * 0.88)),
    isWeb,
    isCompact,
    isMediumUp,
    isTablet,
    isDesktop,
    stackActions: isCompact || frameWidth < 360,
    heroTitleSize: isCompact ? 20 : isTablet ? 28 : 24,
    statCardMinWidthPercent: isCompact ? '100%' : isTablet ? '23%' : '47%',
    listColumns: isTablet ? 2 : 1,
  };
}

export function AdvertiserLayoutProvider({ children }: { children: React.ReactNode }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const value = useMemo(() => computeMetrics(windowWidth, windowHeight), [windowWidth, windowHeight]);

  return <AdvertiserLayoutContext.Provider value={value}>{children}</AdvertiserLayoutContext.Provider>;
}

export function useAdvertiserLayout(): AdvertiserLayoutMetrics {
  const ctx = useContext(AdvertiserLayoutContext);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return useMemo(() => {
    if (ctx) return ctx;
    return computeMetrics(windowWidth, windowHeight);
  }, [ctx, windowWidth, windowHeight]);
}

/** Reusable flex styles for advertiser screens. */
export function useAdvertiserStyles() {
  const { paddingX, contentWidth, frameWidth } = useAdvertiserLayout();

  return useMemo(
    () => ({
      page: {
        flex: 1,
        width: '100%' as const,
        maxWidth: '100%' as const,
        alignSelf: 'stretch' as const,
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
      frameWidth,
    }),
    [paddingX, contentWidth, frameWidth]
  );
}
