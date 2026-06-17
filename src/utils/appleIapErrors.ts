const USER_CANCELLED = /user cancelled|cancelled|canceled|E_USER_CANCELLED/i;
const INACTIVE_SUBSCRIPTION = /inactive subscription/i;
const NOT_CONFIGURED = /not configured|temporarily unavailable/i;
const IN_PROGRESS = /already in progress/i;
const MISSING_PRODUCT = /no skus|product.*not found|invalid product|sku/i;

export function logAppleIapError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  console.warn(`[AppleIAP:${context}]`, message);
}

export function mapAppleIapUserMessage(error: unknown, context = 'purchase'): string | null {
  const raw = error instanceof Error ? error.message : String(error ?? '');

  if (!raw.trim()) {
    return 'We could not complete your purchase. Please try again.';
  }

  logAppleIapError(context, error);

  if (USER_CANCELLED.test(raw)) {
    return null;
  }

  if (INACTIVE_SUBSCRIPTION.test(raw)) {
    return 'Your previous subscription has expired. Please try subscribing again.';
  }

  if (NOT_CONFIGURED.test(raw)) {
    return 'Purchases are temporarily unavailable. Please try again later or contact support.';
  }

  if (IN_PROGRESS.test(raw)) {
    return 'A purchase is already in progress. Please wait a moment.';
  }

  if (MISSING_PRODUCT.test(raw)) {
    return 'This item is not available for purchase right now.';
  }

  if (/could not verify|validation failed|not active yet|fulfillment_failed|refresh your access/i.test(raw)) {
    return 'Purchase completed, but we could not refresh your access. Please tap Restore Purchases or try again.';
  }

  if (/could not confirm/i.test(raw)) {
    return 'Purchase completed, but we could not refresh your access. Please tap Restore Purchases or try again.';
  }

  if (/network|timeout|connection/i.test(raw)) {
    return 'Connection problem. Check your internet and try again.';
  }

  return 'We could not complete your purchase. Please try again or use Restore Purchases.';
}
