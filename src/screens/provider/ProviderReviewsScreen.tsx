import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerReviewsApi from '../../api/providerReviewsApi';
import { formatTimeAgo, fullName } from '../../utils/providerUi';

const STAR_COLOR = '#F59E0B';
const STAR_SIZE = 20;

function clampRating(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(5, Math.max(0, Math.round(v)));
}

function formatReviewDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StarRow({ rating }: { rating: number }) {
  const r = clampRating(rating);
  return (
    <View style={styles.starRow} accessibilityLabel={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= r ? 'star' : 'star-outline'}
          size={STAR_SIZE}
          color={i <= r ? STAR_COLOR : colors.text.muted}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

function ClientAvatar({ name }: { name: string }) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <View style={styles.avatar} accessibilityLabel={`${name} avatar`}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function ReviewCard({ item }: { item: Record<string, unknown> }) {
  const user = item.user as { first_name?: string | null; last_name?: string | null } | null | undefined;
  const name = fullName(user);
  const rating = clampRating(item.rating);
  const comment = typeof item.comment === 'string' ? item.comment.trim() : '';
  const created = typeof item.created_at === 'string' ? item.created_at : '';
  const absolute = formatReviewDate(created);
  const relative = formatTimeAgo(created);
  const providerResponse =
    typeof item.provider_response === 'string' ? item.provider_response.trim() : '';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <ClientAvatar name={name} />
        <View style={styles.cardMain}>
          <Text style={styles.clientName} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
            <Text style={styles.dateText}>
              {absolute || '—'}
              {relative && absolute ? ` · ${relative}` : relative || ''}
            </Text>
          </View>
          <View style={styles.starsBlock}>
            <StarRow rating={rating} />
            <Text style={styles.ratingCaption}>{rating}/5</Text>
          </View>
        </View>
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Feedback</Text>
        {comment ? (
          <Text style={styles.commentBody}>{comment}</Text>
        ) : (
          <View style={styles.commentEmpty}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.text.muted} />
            <Text style={styles.commentEmptyText}>No written comment for this review.</Text>
          </View>
        )}
      </View>

      {!!providerResponse && (
        <View style={styles.responseBox}>
          <View style={styles.responseHeader}>
            <Ionicons name="return-down-forward-outline" size={16} color={colors.primary[700]} />
            <Text style={styles.responseLabel}>Your response</Text>
          </View>
          <Text style={styles.responseText}>{providerResponse}</Text>
        </View>
      )}
    </View>
  );
}

export function ProviderReviewsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const applyPayload = useCallback((pag: Record<string, unknown> | undefined, append: boolean) => {
    const chunk = Array.isArray(pag?.data) ? (pag!.data as Record<string, unknown>[]) : [];
    setRows((prev) => (append ? [...prev, ...chunk] : chunk));
    setPage(typeof pag?.current_page === 'number' ? (pag!.current_page as number) : 1);
    setLastPage(typeof pag?.last_page === 'number' ? (pag!.last_page as number) : 1);
  }, []);

  const load = useCallback(
    async (opts: { page?: number; append?: boolean; isRefresh?: boolean } = {}) => {
      const p = opts.page ?? 1;
      const append = opts.append ?? false;
      const isRefresh = opts.isRefresh ?? false;
      if (isRefresh) setRefreshing(true);
      else if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      const res = await providerReviewsApi.listProviderReviews(p);
      if (isRefresh) setRefreshing(false);
      else if (append) setLoadingMore(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      const pag = res.data?.reviews as Record<string, unknown> | undefined;
      applyPayload(pag, append);
    },
    [applyPayload]
  );

  useFocusEffect(
    useCallback(() => {
      void load({ page: 1, append: false });
    }, [load])
  );

  const onRefresh = () => void load({ page: 1, append: false, isRefresh: true });

  const onEndReached = () => {
    if (loading || loadingMore || refreshing || page >= lastPage) return;
    void load({ page: page + 1, append: true });
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Client reviews</Text>
        <Text style={styles.listSubtitle}>Ratings and feedback from people you have worked with.</Text>
      </View>
    ),
    []
  );

  if (loading && rows.length === 0) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingHint}>Loading reviews…</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.uuid ?? item.id)}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={48} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.empty}>When clients leave feedback, it will show up here.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary[600]} />
          ) : (
            <View style={{ height: spacing.xl }} />
          )
        }
        contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.listContent}
        renderItem={({ item }) => <ReviewCard item={item} />}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  centered: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  listHeader: {
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  listTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  listSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  error: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  empty: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[800],
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    flex: 1,
  },
  starsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCaption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  commentSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  commentBody: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  commentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  commentEmptyText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  responseBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responseLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
