import { Linking, Platform } from 'react-native';

/** Digital goods on iOS must use Apple In-App Purchase (App Store Guideline 3.1.1). */
export function shouldUseAppleIap(): boolean {
  return Platform.OS === 'ios';
}

/** Android Stripe gate: enabled unless the API explicitly reports billing as unavailable. */
export function resolveStripeBillingReady(configured?: boolean | null): boolean {
  if (shouldUseAppleIap()) {
    return false;
  }
  return configured !== false;
}

/** True when a paid plan/item can be purchased on the current platform. */
export function isPaidBillingAvailable(options: {
  priceCents: number;
  stripeReady?: boolean | null;
  appleProductId?: string | null;
  /** Server credential flag — informational only; purchase validation happens on the backend. */
  appleIapConfigured?: boolean;
}): boolean {
  if (options.priceCents <= 0) {
    return true;
  }
  if (shouldUseAppleIap()) {
    // iOS: only require a known App Store product ID (from API/env).
    // Do not gate on apple_iap_configured — that only affects server validation after purchase.
    return String(options.appleProductId ?? '').trim() !== '';
  }
  return resolveStripeBillingReady(options.stripeReady);
}

export async function openAppleSubscriptionManagement(): Promise<void> {
  if (!shouldUseAppleIap()) {
    return;
  }
  await Linking.openURL('https://apps.apple.com/account/subscriptions');
}
