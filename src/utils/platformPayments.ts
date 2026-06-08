import { Linking, Platform } from 'react-native';

/** Digital goods on iOS must use Apple In-App Purchase (App Store Guideline 3.1.1). */
export function shouldUseAppleIap(): boolean {
  return Platform.OS === 'ios';
}

/** True when a paid plan/item can be purchased on the current platform. */
export function isPaidBillingAvailable(options: {
  priceCents: number;
  stripeReady?: boolean;
  appleProductId?: string | null;
  appleIapConfigured?: boolean;
}): boolean {
  if (options.priceCents <= 0) {
    return true;
  }
  if (shouldUseAppleIap()) {
    return Boolean(options.appleIapConfigured && String(options.appleProductId ?? '').trim() !== '');
  }
  return Boolean(options.stripeReady);
}

export async function openAppleSubscriptionManagement(): Promise<void> {
  if (!shouldUseAppleIap()) {
    return;
  }
  await Linking.openURL('https://apps.apple.com/account/subscriptions');
}
