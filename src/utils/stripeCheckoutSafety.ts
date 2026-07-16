import { Alert } from 'react-native';
import { PRICING_LABELS } from '../config/pricingLabels';

/** Non-sensitive diagnostic codes only — never log full checkout URLs or keys. */
export type StripeCheckoutDiagnosticCode =
  | 'STRIPE_CHECKOUT_URL_EMPTY'
  | 'STRIPE_CHECKOUT_URL_MALFORMED'
  | 'STRIPE_CHECKOUT_URL_INSECURE'
  | 'STRIPE_CHECKOUT_HOST_UNTRUSTED'
  | 'STRIPE_CHECKOUT_TEST_IN_PRODUCTION';

export class StripeCheckoutSafetyError extends Error {
  readonly diagnosticCode: StripeCheckoutDiagnosticCode;

  constructor(diagnosticCode: StripeCheckoutDiagnosticCode) {
    super(PRICING_LABELS.paymentsTemporarilyUnavailable);
    this.name = 'StripeCheckoutSafetyError';
    this.diagnosticCode = diagnosticCode;
  }
}

const TRUSTED_CHECKOUT_HOSTS = new Set(['checkout.stripe.com', 'pay.stripe.com']);

function isProductionClientBuild(): boolean {
  return !__DEV__;
}

function looksLikeStripeTestCheckout(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('cs_test_') ||
    lower.includes('/test/') ||
    /[?&]mode=test(?:&|$)/i.test(url)
  );
}

/**
 * Validates a backend-issued Stripe Checkout URL before opening a WebView.
 * The mobile app never holds Stripe secrets; this only guards against bad/test URLs in production.
 */
export function assertSafeStripeCheckoutUrl(url: string): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) {
    throw new StripeCheckoutSafetyError('STRIPE_CHECKOUT_URL_EMPTY');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new StripeCheckoutSafetyError('STRIPE_CHECKOUT_URL_MALFORMED');
  }

  if (parsed.protocol !== 'https:') {
    throw new StripeCheckoutSafetyError('STRIPE_CHECKOUT_URL_INSECURE');
  }

  const host = parsed.hostname.toLowerCase();
  if (!TRUSTED_CHECKOUT_HOSTS.has(host)) {
    throw new StripeCheckoutSafetyError('STRIPE_CHECKOUT_HOST_UNTRUSTED');
  }

  if (isProductionClientBuild() && looksLikeStripeTestCheckout(trimmed)) {
    throw new StripeCheckoutSafetyError('STRIPE_CHECKOUT_TEST_IN_PRODUCTION');
  }

  return trimmed;
}

export function resolveSafeStripeCheckoutUrl(url: string | null | undefined): string | null {
  try {
    return assertSafeStripeCheckoutUrl(String(url ?? ''));
  } catch (error) {
    if (error instanceof StripeCheckoutSafetyError) {
      if (__DEV__) {
        console.warn(`[StripeCheckout] blocked (${error.diagnosticCode})`);
      }
      return null;
    }
    throw error;
  }
}

export function alertPaymentsUnavailable(error?: unknown): void {
  if (__DEV__ && error instanceof StripeCheckoutSafetyError) {
    console.warn(`[StripeCheckout] ${error.diagnosticCode}`);
  }
  Alert.alert(PRICING_LABELS.checkoutUnavailableTitle, PRICING_LABELS.paymentsTemporarilyUnavailable);
}
