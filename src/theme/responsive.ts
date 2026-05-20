/** Strict mobile-first layout for advertiser portal. */
export const STRICT_MOBILE_MAX_WIDTH = 480;

export const BREAKPOINTS = {
  compact: 380,
  medium: 600,
  tablet: 768,
  desktop: 1024,
} as const;

export const CONTENT_MAX_WIDTH = STRICT_MOBILE_MAX_WIDTH;
export const CONTENT_MAX_WIDTH_WIDE = STRICT_MOBILE_MAX_WIDTH;
export const DRAWER_MAX_WIDTH = 300;

/** Horizontal padding inside advertiser pages. */
export const ADVERTISER_PAGE_PADDING = 16;
