import { colors } from './colors';

/**
 * Drawer panel: deep blue → indigo.
 * Uses literals so the export is always defined (same as `colors.primary[800]`, `[950]`, slate-900).
 */
export const drawerGradient = ['#184EAD', '#142B53', '#0F172A'] as const;

/** Provider dashboard hero: same family as the drawer, stepped a bit lighter. */
export const providerHeroGradient = ['#175FD5', '#184EAD', '#1A4488'] as const;

/** Main app canvas: airy blue → white */
export const screenGradient = [colors.primary[50], '#F8FAFC', colors.background] as const;
