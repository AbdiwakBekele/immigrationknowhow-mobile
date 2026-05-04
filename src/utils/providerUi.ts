import { colors } from '../theme/colors';

export function fullName(
  p: { first_name?: string | null; last_name?: string | null } | null | undefined
): string {
  if (!p) return 'Client';
  const a = (p.first_name || '').trim();
  const b = (p.last_name || '').trim();
  return [a, b].filter(Boolean).join(' ') || 'Client';
}

export function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString();
}

/** List row time: today = clock, yesterday, weekday, or short date. */
export function formatConversationListTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.floor((startOf(now) - startOf(d)) / 86_400_000);
  if (dayDiff === 0) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const LEAD_STATUS_ORDER = [
  'new',
  'contacted',
  'in_progress',
  'converted',
  'closed',
  'declined',
] as const;
export type LeadStatusValue = (typeof LEAD_STATUS_ORDER)[number] | string;

export function leadStatusLabel(status: string | undefined): string {
  if (!status) return '';
  return status.replace(/_/g, ' ');
}

export function leadStatusStyle(status: string | undefined): { bg: string; text: string; border: string } {
  const s = (status || '').toLowerCase();
  const map: Record<string, { bg: string; text: string; border: string }> = {
    new: { bg: '#fffbeb', text: '#a16207', border: '#fde68a' },
    contacted: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    in_progress: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
    converted: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    closed: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
    declined: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };
  return (
    map[s] ?? {
      bg: colors.surface,
      text: colors.text.secondary,
      border: colors.border,
    }
  );
}

export function urgencyLabel(u: string | undefined): string {
  if (!u) return '';
  return u.charAt(0).toUpperCase() + u.slice(1);
}

export function backgroundCheckHeadline(status: string | undefined): string {
  switch (status) {
    case 'clear':
      return 'Verified';
    case 'invited':
      return 'Complete your background check';
    case 'completed':
      return 'Background check under review';
    default:
      return 'Background check required';
  }
}

export function backgroundCheckBody(status: string | undefined): string {
  switch (status) {
    case 'invited':
      return 'Check your email for the invitation link from our verification partner.';
    case 'completed':
      return 'Your screening is being reviewed. You will be notified when it completes.';
    case 'clear':
      return '';
    default:
      return 'Completing verification helps clients trust your profile in the marketplace.';
  }
}
