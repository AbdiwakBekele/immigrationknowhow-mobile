/** @deprecated Use getAdvertiserFrameWidth — kept for legacy imports */
export const STRICT_MOBILE_MAX_WIDTH = 480;

export const BREAKPOINTS = {
  compact: 380,
  medium: 600,
  tablet: 768,
  desktop: 1024,
} as const;

export const CONTENT_MAX_WIDTH = 720;
export const CONTENT_MAX_WIDTH_WIDE = 1100;

export const ADVERTISER_MAX_WIDTH_TABLET = 768;
export const ADVERTISER_MAX_WIDTH_DESKTOP = 1100;

export const DRAWER_MAX_WIDTH = 300;

/** Horizontal padding inside advertiser pages (fallback). */
export const ADVERTISER_PAGE_PADDING = 16;

/** Content width for the advertiser shell (always full viewport / device width). */
export function getAdvertiserFrameWidth(windowWidth: number): number {
  return windowWidth;
}
