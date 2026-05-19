import type { ProviderNotificationRow } from '../api/providerNotificationsApi';

export type NotificationTarget =
  | { kind: 'lead'; uuid: string }
  | { kind: 'chat'; uuid: string }
  | { kind: 'reviews' }
  | { kind: 'profile' };

export function notificationSummary(row: Pick<ProviderNotificationRow, 'type' | 'data'>): string {
  const d = row.data ?? {};
  if (typeof d.message === 'string' && d.message.trim()) {
    return d.message.trim();
  }
  if (d.type === 'new_message' && typeof d.sender_name === 'string') {
    const preview = typeof d.message_preview === 'string' ? d.message_preview.trim() : '';
    return preview ? `Message from ${d.sender_name}` : `New message from ${d.sender_name}`;
  }
  if (typeof d.title === 'string' && d.title.trim()) {
    return d.title.trim();
  }
  const base = row.type?.split('\\').pop() || 'Notification';
  return base.replace(/([A-Z])/g, ' $1').trim();
}

export function notificationDetailLine(row: Pick<ProviderNotificationRow, 'data'>): string | null {
  const d = row.data ?? {};
  if (d.type === 'new_message' && typeof d.message_preview === 'string' && d.message_preview.trim()) {
    return d.message_preview.trim();
  }
  if (typeof d.reason === 'string' && d.reason.trim()) {
    return d.reason.trim();
  }
  return null;
}

export function notificationIconName(row: Pick<ProviderNotificationRow, 'type' | 'data'>): string {
  const d = row.data ?? {};
  if (d.type === 'new_message') return 'chatbubble-outline';
  if (d.type === 'new_review') return 'star-outline';
  if (d.type === 'verification_approved') return 'shield-checkmark-outline';
  if (d.type === 'verification_rejected') return 'alert-circle-outline';
  if (d.lead_uuid) return 'mail-unread-outline';
  const type = (row.type || '').toLowerCase();
  if (type.includes('lead')) return 'mail-unread-outline';
  if (type.includes('message')) return 'chatbubble-outline';
  if (type.includes('review')) return 'star-outline';
  return 'notifications-outline';
}

export function notificationTarget(row: Pick<ProviderNotificationRow, 'data'>): NotificationTarget | null {
  const d = row.data ?? {};
  if (typeof d.lead_uuid === 'string' && d.lead_uuid) {
    return { kind: 'lead', uuid: d.lead_uuid };
  }
  if (typeof d.conversation_uuid === 'string' && d.conversation_uuid) {
    return { kind: 'chat', uuid: d.conversation_uuid };
  }
  if (d.type === 'new_review') {
    return { kind: 'reviews' };
  }
  if (d.type === 'verification_approved' || d.type === 'verification_rejected') {
    return { kind: 'profile' };
  }
  return null;
}

export function notificationTargetLabel(target: NotificationTarget | null): string | null {
  if (!target) return null;
  switch (target.kind) {
    case 'lead':
      return 'View lead';
    case 'chat':
      return 'Open chat';
    case 'reviews':
      return 'View reviews';
    case 'profile':
      return 'View profile';
    default:
      return null;
  }
}
