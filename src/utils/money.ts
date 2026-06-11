const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

export const ONE_TIME_PURCHASE_LABEL = 'One-time Purchase (not a subscription)';

export function formatMoney(amount: number, currency = 'USD'): string {
  const code = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  const value = amount.toFixed(2);
  if (symbol) {
    return `${symbol}${value}`;
  }
  return `${code} ${value}`;
}

export function formatMoneyFromCents(cents: number, currency = 'USD'): string {
  return formatMoney(cents / 100, currency);
}

export function formatPerUnit(amount: number, currency: string, unit: string): string {
  return `${formatMoney(amount, currency)} per ${unit}`;
}

export function formatPerUnitFromCents(cents: number, currency: string, unit: string): string {
  return `${formatMoneyFromCents(cents, currency)} per ${unit}`;
}

export function formatSubscriptionPrice(
  cents: number,
  currency = 'USD',
  billingCycle?: string | null,
): string {
  const price = formatMoneyFromCents(cents, currency);
  const cycle = (billingCycle ?? 'month').toLowerCase();
  if (cycle === 'month' || cycle === 'monthly') {
    return `${price} per month`;
  }
  if (cycle === 'year' || cycle === 'yearly' || cycle === 'annual') {
    return `${price} per year`;
  }
  return `${price} / ${cycle}`;
}
