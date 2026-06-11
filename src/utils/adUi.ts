import { colors } from '../theme/colors';
import { formatMoneyFromCents, formatPerUnitFromCents } from './money';

export function adStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    published: 'Published',
    pending_payment: 'Pending payment',
    pending_approval: 'Pending approval',
    draft: 'Draft',
    rejected: 'Rejected',
    suspended: 'Suspended',
    pending: 'Pending',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

export function adStatusStyle(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'published':
      return { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' };
    case 'pending_payment':
      return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
    case 'pending_approval':
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    case 'rejected':
      return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' };
    case 'suspended':
      return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' };
    default:
      return { bg: colors.surfaceElevated, text: colors.text.secondary, border: colors.border };
  }
}

export function formatAdPrice(cents?: number, currency?: string): string | null {
  if (cents == null) return null;
  return formatMoneyFromCents(cents, currency ?? 'USD');
}

export function formatAdPricePerUnit(cents?: number, currency?: string): string | null {
  if (cents == null) return null;
  return formatPerUnitFromCents(cents, currency ?? 'USD', 'Ad');
}
