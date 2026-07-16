/**
 * Central payment helpers for the mobile app.
 *
 * Architecture (do not change without a security review):
 * - iOS digital goods: Apple IAP via expo-iap + backend validation
 * - Android: Stripe Checkout Session URLs from the IKH backend, opened in a WebView
 * - The mobile app must never store Stripe secret/restricted/webhook keys
 * - The mobile app must never call api.stripe.com with credentials
 * - No @stripe/stripe-react-native publishable-key init is required for Checkout WebView
 *
 * Existing backend routes used by feature APIs:
 * - POST /api/mobile/ads/{uuid}/checkout (+ confirm-checkout)
 * - POST /api/mobile/videos/{slug}/checkout (+ confirm-checkout)
 * - POST /api/mobile/library/items/{slug}/checkout (+ confirm-checkout)
 * - POST /api/mobile/provider/subscriptions/checkout/{planUuid} (+ confirm-checkout)
 * - POST /api/mobile/ai-assistant/checkout (+ confirm-checkout)
 * - Onboarding complete may return checkout_url
 */

export {
  alertPaymentsUnavailable,
  assertSafeStripeCheckoutUrl,
  resolveSafeStripeCheckoutUrl,
  StripeCheckoutSafetyError,
} from '../utils/stripeCheckoutSafety';
