import type { ProviderSubscriptionRow, SubscriptionsPayload } from '../api/providerSubscriptionsApi';

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due']);

export function isActiveProviderSubscription(
  sub: ProviderSubscriptionRow | null | undefined,
): boolean {
  if (!sub) return false;
  return ACTIVE_STATUSES.has(sub.status);
}

export function providerRequiresSubscription(payload: SubscriptionsPayload | null | undefined): boolean {
  if (!payload) return false;
  if (typeof payload.requires_subscription === 'boolean') {
    return payload.requires_subscription;
  }
  const hasPaidPlans = (payload.plans ?? []).some((plan) => plan.price_cents > 0);
  return hasPaidPlans && !isActiveProviderSubscription(payload.current_subscription);
}

export function isAnnualBillingCycle(cycle: string | null | undefined): boolean {
  const normalized = (cycle ?? '').toLowerCase();
  return normalized === 'year' || normalized === 'yearly' || normalized === 'annual';
}

export function isMonthlyBillingCycle(cycle: string | null | undefined): boolean {
  const normalized = (cycle ?? '').toLowerCase();
  return normalized === 'month' || normalized === 'monthly';
}
