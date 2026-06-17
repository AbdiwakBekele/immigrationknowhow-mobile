import type { ProviderSubscriptionRow, SubscriptionsPayload, SubscriptionPlanRow } from '../api/providerSubscriptionsApi';
import { IAP_DISPLAY_PRICES_CENTS } from '../config/iapCatalog';
import { formatSubscriptionPrice } from './money';

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

type ProviderPlanPricing = Pick<SubscriptionPlanRow, 'price_cents' | 'currency' | 'billing_cycle'>;

export function buildProviderSubscriptionPricingHint(
  plans: ProviderPlanPricing[] = [],
): string {
  const monthly = plans.find((plan) => plan.price_cents > 0 && isMonthlyBillingCycle(plan.billing_cycle));
  const yearly = plans.find((plan) => plan.price_cents > 0 && isAnnualBillingCycle(plan.billing_cycle));
  const parts: string[] = [];

  if (monthly) {
    parts.push(
      `Monthly: ${formatSubscriptionPrice(monthly.price_cents, monthly.currency ?? 'USD', monthly.billing_cycle)}`,
    );
  }
  if (yearly) {
    parts.push(
      `Yearly: ${formatSubscriptionPrice(yearly.price_cents, yearly.currency ?? 'USD', yearly.billing_cycle)}`,
    );
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  return `Monthly: ${formatSubscriptionPrice(IAP_DISPLAY_PRICES_CENTS.PROVIDER_MONTHLY, 'USD', 'monthly')} · Yearly: ${formatSubscriptionPrice(IAP_DISPLAY_PRICES_CENTS.PROVIDER_YEARLY, 'USD', 'yearly')}`;
}
