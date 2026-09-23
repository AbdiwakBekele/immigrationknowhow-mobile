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
  const value = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    const symbol = CURRENCY_SYMBOLS[code];
    const text = value.toFixed(2);
    if (symbol) {
      return `${symbol}${text}`;
    }
    return `${code} ${text}`;
  }
}

export function normalizePriceCents(cents: unknown): number {
  const value = Number(cents);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value);
}

export function formatMoneyFromCents(cents: number, currency = 'USD'): string {
  return formatMoney(normalizePriceCents(cents) / 100, currency);
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
  const cycle = (billingCycle ?? 'month').toLowerCase().trim();
  if (cycle === 'month' || cycle === 'monthly') {
    return `${price} per month`;
  }
  if (cycle === 'year' || cycle === 'yearly' || cycle === 'annual' || cycle === 'annually') {
    return `${price} per year`;
  }
  return `${price} / ${cycle}`;
}
