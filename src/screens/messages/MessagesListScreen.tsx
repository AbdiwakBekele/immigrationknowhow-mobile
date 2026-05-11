import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
import type { MessagesStackParamList } from './MessagesStack';
import { formatConversationListTime, fullName, leadStatusLabel, leadStatusStyle } from '../../utils/providerUi';

function counterpartName(role: string | null | undefined, item: messagesApi.ConversationItem): string {
  if (role === 'provider') return fullName(item.user);
  return fullName(item.provider_user) || (item.subject ?? '').trim() || 'Conversation';
}

type ConversationGroup = {
  key: string;
  title: string;
  latest: messagesApi.ConversationItem;
  conversations: messagesApi.ConversationItem[];
  unreadCount: number;
};

function conversationTimestamp(item: messagesApi.ConversationItem): number {
  const raw = item.last_message_at ?? item.latest_message?.created_at ?? null;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function counterpartKey(role: string | null | undefined, item: messagesApi.ConversationItem): string {
  const participant = role === 'provider' ? item.user : item.provider_user;
  const prefix = role === 'provider' ? 'user' : 'provider';
  if (participant?.id != null) {
    return `${prefix}:${participant.id}`;
  }
  return `${prefix}:name:${counterpartName(role, item).trim().toLowerCase()}`;
}

function groupConversations(role: string | null | undefined, items: messagesApi.ConversationItem[]): ConversationGroup[] {
  const grouped = new Map<string, ConversationGroup>();

  for (const item of items) {
    const key = counterpartKey(role, item);
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        key,
        title: counterpartName(role, item),
        latest: item,
        conversations: [item],
        unreadCount: item.unread_count ?? 0,
      });
      continue;
    }

    current.conversations.push(item);
    current.unreadCount += item.unread_count ?? 0;
    if (conversationTimestamp(item) > conversationTimestamp(current.latest)) {
      current.latest = item;
      current.title = counterpartName(role, item);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => conversationTimestamp(b.latest) - conversationTimestamp(a.latest));
}

function participantInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : parts[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase() || '?';
}

export function MessagesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<messagesApi.ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const [listRes, unreadRes] = await Promise.all([messagesApi.listConversations(), messagesApi.unreadCount()]);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!listRes.success) {
      setError(listRes.message);
      return;
    }
    setItems(listRes.data.conversations ?? []);
    if (unreadRes.success) setUnreadTotal(unreadRes.data.count ?? 0);
  }, []);

  const runConversationAction = useCallback(
    async (group: ConversationGroup, action: 'read' | 'archive') => {
      setBusyUuid(group.key);
      const targets =
        action === 'read'
          ? group.conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0)
          : group.conversations;

      for (const conversation of targets) {
        const res =
          action === 'read'
            ? await messagesApi.markConversationRead(conversation.uuid)
            : await messagesApi.archiveConversation(conversation.uuid);
        if (!res.success) {
          setBusyUuid(null);
          setError(res.message);
          return;
        }
      }

      setBusyUuid(null);
      void load(false);
    },
    [load]
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const groupedItems = useMemo(() => groupConversations(role, items), [items, role]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedItems;
    return groupedItems.filter((group) => group.title.toLowerCase().includes(q));
  }, [groupedItems, search]);

  const headerSubtitle =
    role === 'provider'
      ? unreadTotal > 0
        ? `${unreadTotal} unread chats grouped by client.`
        : 'All caught up. Chats are grouped by client.'
      : unreadTotal > 0
        ? `${unreadTotal} unread messages grouped by provider.`
        : 'All caught up. Chats are grouped by provider.';

  if (loading && !refreshing && items.length === 0) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading conversations…</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(group) => group.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Messaging</Text>
              <Text style={styles.heroTitle}>{role === 'provider' ? 'Client messages' : 'Messages'}</Text>
              <Text style={styles.heroSubtitle}>{headerSubtitle}</Text>
              <View style={styles.heroActions}>
                <View style={styles.statChip}>
                  <Ionicons name="mail-unread-outline" size={16} color={colors.primary[700]} />
                  <Text style={styles.statText}>{unreadTotal} unread</Text>
                </View>
                <Pressable style={styles.archivedButton} onPress={() => navigation.navigate('ArchivedMessages')}>
                  <Ionicons name="archive-outline" size={16} color={colors.text.primary} />
                  <Text style={styles.archivedButtonText}>Archived</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.searchShell}>
              <Ionicons name="search-outline" size={18} color={colors.text.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={role === 'provider' ? 'Search by client name…' : 'Search by provider name…'}
                placeholderTextColor={colors.text.muted}
                style={styles.searchInput}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={52} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>{search.trim() ? 'No matching chats' : 'No conversations yet'}</Text>
            <Text style={styles.emptyText}>
              {search.trim()
                ? 'Try a different name or clear your search.'
                : 'When someone starts a conversation, it will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item: group }) => {
          const item = group.latest;
          const title = group.title;
          const st = leadStatusStyle(item.lead?.status);
          const hasUnread = group.unreadCount > 0;

          return (
            <Pressable onPress={() => navigation.navigate('Chat', { uuid: item.uuid })} style={[styles.threadCard, hasUnread && styles.threadCardUnread]}>
              <View style={styles.threadRow}>
                <View style={[styles.avatarWrap, hasUnread && styles.avatarWrapUnread]}>
                  <Text style={[styles.avatarText, hasUnread && styles.avatarTextUnread]}>{participantInitials(title)}</Text>
                </View>
                <View style={styles.threadContent}>
                  <View style={styles.threadTopRow}>
                    <Text style={[styles.threadTitle, hasUnread && styles.threadTitleUnread]} numberOfLines={1}>
                      {title}
                    </Text>
                    <View style={styles.timePill}>
                      <Text style={styles.timeText}>{formatConversationListTime(item.last_message_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.chipRow}>
                    {item.lead?.service_type_label || item.lead?.service_type ? (
                      <View style={styles.infoChip}>
                        <Text style={styles.infoChipText}>{item.lead?.service_type_label || item.lead?.service_type}</Text>
                      </View>
                    ) : null}
                    {!!item.lead?.status && (
                      <View style={[styles.infoChip, { backgroundColor: st.bg, borderWidth: 1, borderColor: st.border }]}>
                        <Text style={[styles.infoChipText, { color: st.text }]}>{leadStatusLabel(item.lead.status)}</Text>
                      </View>
                    )}
                    {group.conversations.length > 1 && (
                      <View style={styles.infoChip}>
                        <Text style={styles.infoChipText}>{group.conversations.length} inquiries</Text>
                      </View>
                    )}
                  </View>
                  {!!item.latest_message?.body && (
                    <Text numberOfLines={2} style={styles.previewText}>
                      {item.latest_message.body}
                    </Text>
                  )}
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{group.unreadCount > 9 ? '9+' : group.unreadCount} unread</Text>
                    </View>
                  )}
                  <View style={styles.actionRow}>
                    <Pressable
                      disabled={busyUuid === group.key}
                      onPress={() => void runConversationAction(group, 'read')}
                      style={[styles.actionButton, styles.actionRead, busyUuid === group.key && styles.actionButtonDisabled]}
                    >
                      <Text style={styles.actionTextRead}>{group.conversations.length > 1 ? 'Mark all read' : 'Mark read'}</Text>
                    </Pressable>
                    <Pressable
                      disabled={busyUuid === group.key}
                      onPress={() => void runConversationAction(group, 'archive')}
                      style={[styles.actionButton, styles.actionArchive, busyUuid === group.key && styles.actionButtonDisabled]}
                    >
                      <Text style={styles.actionTextArchive}>{group.conversations.length > 1 ? 'Archive all' : 'Archive'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginTop: spacing.lg,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  headerWrap: {
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    ...shadows.softLg,
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: typography.fontWeight.semibold,
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    lineHeight: 21,
  },
  heroActions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  archivedButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  archivedButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  searchShell: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.xs,
  },
  emptyWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  threadCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.soft,
  },
  threadCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FAFCFF',
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginRight: spacing.md,
  },
  avatarWrapUnread: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  avatarText: {
    color: colors.primary[800],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  avatarTextUnread: {
    color: colors.text.inverse,
  },
  threadContent: {
    flex: 1,
    minWidth: 0,
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  threadTitle: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  threadTitleUnread: {
    fontWeight: typography.fontWeight.bold,
  },
  timePill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.backgroundMuted,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  infoChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.backgroundMuted,
  },
  infoChipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  previewText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
  },
  unreadBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
  },
  unreadBadgeText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  actionRead: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  actionArchive: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionTextRead: {
    color: '#047857',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  actionTextArchive: {
    color: '#A16207',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
