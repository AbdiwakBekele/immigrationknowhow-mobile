import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { NotificationsHeaderActions } from '../../components/notifications/NotificationsHeaderActions';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as notificationsApi from '../../api/providerNotificationsApi';
import { formatConversationListTime } from '../../utils/providerUi';
import {
  notificationDetailLine,
  notificationIconName,
  notificationSummary,
  notificationTarget,
  notificationTargetLabel,
  type NotificationTarget,
} from '../../utils/notificationsUi';

function openNotificationTarget(navigation: NavigationProp<ReactNavigation.RootParamList>, target: NotificationTarget) {
  const tab = navigation.getParent();
  if (!tab) return;

  switch (target.kind) {
    case 'lead':
      tab.navigate('Leads' as never, { screen: 'LeadDetail', params: { uuid: target.uuid } } as never);
      break;
    case 'chat':
      tab.navigate('Messages' as never, { screen: 'Chat', params: { uuid: target.uuid } } as never);
      break;
    case 'reviews':
      tab.navigate(
        'Dashboard' as never,
        { screen: 'ProviderReviews' } as never
      );
      break;
    case 'profile':
      tab.navigate('Profile' as never);
      break;
    default:
      break;
  }
}

function SeekerNotificationsPlaceholder() {
  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <View style={styles.emptyWrap}>
        <Ionicons name="notifications-outline" size={52} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          When the system sends in-app alerts to your account, they will appear here.
        </Text>
      </View>
    </AppScreen>
  );
}

function ProviderNotificationsList() {
  const navigation = useNavigation<NavigationProp<ReactNavigation.RootParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<notificationsApi.ProviderNotificationRow[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const hasUnread = useMemo(() => !missingTable && rows.some((r) => !r.read_at), [missingTable, rows]);
  const unreadCount = useMemo(() => rows.filter((r) => !r.read_at).length, [rows]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await notificationsApi.listProviderNotifications();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMissingTable(res.data.payload.notifications_table_missing);
    setRows(res.data.payload.notifications.data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const markRead = useCallback(async (id: string) => {
    setMarkingId(id);
    const res = await notificationsApi.markProviderNotificationRead(id);
    setMarkingId(null);
    if (res.success) void load(true);
  }, [load]);

  const markAll = useCallback(async () => {
    setMarkingAll(true);
    const res = await notificationsApi.markAllProviderNotificationsRead();
    setMarkingAll(false);
    if (res.success) void load(true);
  }, [load]);

  useLayoutEffect(() => {
    // @ts-expect-error app-defined route params
    navigation.setParams?.({ unreadNotificationsCount: unreadCount });
    navigation.setOptions({
      headerActions: (
        <NotificationsHeaderActions
          visible={!missingTable && hasUnread}
          busy={markingAll}
          onMarkAllRead={() => void markAll()}
        />
      ),
    });
    return () => {
      navigation.setOptions({ headerActions: undefined });
    };
  }, [navigation, missingTable, hasUnread, markingAll, unreadCount, markAll]);

  const onOpenRow = async (row: notificationsApi.ProviderNotificationRow) => {
    const target = notificationTarget(row);
    if (!row.read_at) {
      await markRead(row.id);
    }
    if (target) {
      openNotificationTarget(navigation, target);
    }
  };

  if (loading && !refreshing && rows.length === 0) {
    return (
      <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load(false)} hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {missingTable ? (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#B45309" />
          <Text style={styles.warningText}>Notifications are not available on this server yet.</Text>
        </View>
      ) : null}

      <FlatList
        style={styles.list}
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={rows.length === 0 ? styles.listContentEmpty : styles.listContent}
        ListEmptyComponent={
          !missingTable ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={52} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                When the system sends in-app alerts to your provider account, they will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const unread = !item.read_at;
          const summary = notificationSummary(item);
          const detail = notificationDetailLine(item);
          const target = notificationTarget(item);
          const targetLabel = notificationTargetLabel(target);
          const icon = notificationIconName(item) as React.ComponentProps<typeof Ionicons>['name'];
          const busy = markingId === item.id;

          return (
            <Pressable
              onPress={() => void onOpenRow(item)}
              disabled={busy}
              style={[styles.card, unread && styles.cardUnread, busy && styles.cardBusy]}
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
                  <Ionicons name={icon} size={22} color={unread ? colors.text.inverse : colors.primary[700]} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.summary, unread && styles.summaryUnread]} numberOfLines={2}>
                      {summary}
                    </Text>
                    <View style={styles.timePill}>
                      <Text style={styles.timeText}>{formatConversationListTime(item.created_at)}</Text>
                    </View>
                  </View>
                  {!!detail && (
                    <Text style={styles.detail} numberOfLines={2}>
                      {detail}
                    </Text>
                  )}
                  <View style={styles.footerRow}>
                    {unread ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>Unread</Text>
                      </View>
                    ) : null}
                    {!!targetLabel && (
                      <View style={styles.viewChip}>
                        <Text style={styles.viewChipText}>{targetLabel}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary[700]} />
                      </View>
                    )}
                  </View>
                  {unread && !target && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        void markRead(item.id);
                      }}
                      disabled={busy}
                      style={[styles.markReadBtn, busy && styles.markReadBtnDisabled]}
                    >
                      <Text style={styles.markReadText}>Mark read</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </AppScreen>
  );
}

export function NotificationsScreen() {
  const { role } = useAuth();
  if (role === 'provider') {
    return <ProviderNotificationsList />;
  }
  return <SeekerNotificationsPlaceholder />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  list: {
    flex: 1,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  retryText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    marginBottom: spacing.sm,
  },
  warningText: {
    flex: 1,
    color: '#92400E',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  emptyWrap: {
    flex: 1,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 320,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.soft,
  },
  cardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FAFCFF',
  },
  cardBusy: {
    opacity: 0.85,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginRight: spacing.md,
  },
  iconWrapUnread: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  summary: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 21,
  },
  summaryUnread: {
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
  detail: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  unreadBadge: {
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
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary[50],
  },
  viewChipText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  markReadBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  markReadBtnDisabled: {
    opacity: 0.6,
  },
  markReadText: {
    color: '#047857',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
