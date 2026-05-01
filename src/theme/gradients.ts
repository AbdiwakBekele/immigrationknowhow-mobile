import { colors } from './colors';

/** Drawer panel: deep blue → indigo */
export const drawerGradient = [colors.primary[800], colors.primary[950], '#0F172A'] as const;

/** Main app canvas: airy blue → white */
export const screenGradient = [colors.primary[50], '#F8FAFC', colors.background] as const;
