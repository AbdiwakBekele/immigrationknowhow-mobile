import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { BREAKPOINTS, CONTENT_MAX_WIDTH, CONTENT_MAX_WIDTH_WIDE, DRAWER_MAX_WIDTH } from '../theme/responsive';
import { spacing } from '../theme/spacing';

export type ResponsiveLayout = {
  width: number;
  height: number;
  isCompact: boolean;
  isMediumUp: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  paddingX: number;
  contentMaxWidth: number;
  drawerWidth: number;
  listColumns: number;
  statCardMinWidthPercent: string;
  /** Stack ad action buttons vertically on narrow phones. */
  stackActions: boolean;
  heroTitleSize: number;
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isCompact = width < BREAKPOINTS.compact;
    const isMediumUp = width >= BREAKPOINTS.medium;
    const isTablet = width >= BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.desktop;
    const isWeb = Platform.OS === 'web';

    const paddingX = isCompact ? spacing.sm : isTablet ? spacing['2xl'] : spacing.lg;
    const contentMaxWidth = isDesktop
      ? CONTENT_MAX_WIDTH_WIDE
      : isTablet
        ? CONTENT_MAX_WIDTH
        : width;
    const drawerWidth = Math.min(DRAWER_MAX_WIDTH, Math.round(width * 0.86));
    const listColumns = isTablet ? 2 : 1;

    return {
      width,
      height,
      isCompact,
      isMediumUp,
      isTablet,
      isDesktop,
      isWeb,
      paddingX,
      contentMaxWidth,
      drawerWidth,
      listColumns,
      statCardMinWidthPercent: isCompact ? '100%' : isTablet ? '23%' : '47%',
      stackActions: isCompact || width < 360,
      heroTitleSize: isCompact ? 22 : 28,
    };
  }, [width, height]);
}
