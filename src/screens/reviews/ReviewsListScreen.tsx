import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import type { SeekerDiscoverStackParamList } from '../discover/SeekerDiscoverStack';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as reviewsApi from '../../api/reviewsApi';
import { formatTimeAgo } from '../../utils/providerUi';

type ReviewsNav = NativeStackNavigationProp<SeekerDiscoverStackParamList, 'Reviews'>;

type ProviderPreview = {
  slug?: string | null;
  business_name?: string | null;
};

type ReviewRow = {
  uuid: string;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
  provider_response?: string | null;
  provider_responded_at?: string | null;
  service_provider?: ProviderPreview | null;
};

type PaginatedReviews = {
  data?: ReviewRow[];
  current_page?: number;
  last_page?: number;
};

const STAR_COLOR = '#F59E0B';

function clampRating(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(5, Math.max(0, Math.round(numeric)));
}

function formatReviewDate(date: string | null | undefined): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function providerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SP';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : parts[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase() || 'SP';
}

function StarRow({ rating }: { rating: number }) {
  const value = clampRating(rating);
  return (
    <View style={styles.starRow} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons key={star} name={star <= value ? 'star' : 'star-outline'} size={18} color={star <= value ? STAR_COLOR : colors.text.muted} />
      ))}
    </View>
  );
}

function ReviewCard({
  item,
  onOpenProvider,
}: {
  item: ReviewRow;
  onOpenProvider: (slug: string) => void;
}) {
  const providerName = item.service_provider?.business_name?.trim() || 'Service Provider';
  const comment = item.comment?.trim() || '';
  const providerResponse = item.provider_response?.trim() || '';
  const createdLabel = formatReviewDate(item.created_at);
  const respondedLabel = formatReviewDate(item.provider_responded_at);
  const relativeLabel = item.created_at ? formatTimeAgo(item.created_at) : '';
  const rating = clampRating(item.rating);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.providerIdentity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{providerInitials(providerName)}</Text>
          </View>
          <View style={styles.providerTextWrap}>
            <Text style={styles.providerName}>{providerName}</Text>
            {!!createdLabel && (
              <Text style={styles.dateChip}>
                {createdLabel}
                {relativeLabel ? ` · ${relativeLabel}` : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.ratingWrap}>
          <StarRow rating={rating} />
          <Text style={styles.ratingText}>{rating}/5</Text>
        </View>
      </View>

      {!!item.service_provider?.slug && (
        <Pressable onPress={() => onOpenProvider(item.service_provider!.slug!)} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>View provider profile</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary[700]} />
        </Pressable>
      )}

      <Text style={styles.commentBody}>{comment || 'No written comment.'}</Text>

      {!!providerResponse && (
        <View style={styles.responseBox}>
          <View style={styles.responseHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary[700]} />
            <Text style={styles.responseTitle}>Provider response</Text>
          </View>
          <Text style={styles.responseBody}>{providerResponse}</Text>
          {!!respondedLabel && <Text style={styles.responseMeta}>Responded on {respondedLabel}</Text>}
        </View>
      )}
    </View>
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
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  listEmpty: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  headerWrap: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
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
  emptyButton: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  footerWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  providerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[800],
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
  providerTextWrap: {
    flex: 1,
  },
  providerName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  dateChip: {
    marginTop: spacing.xs,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
  ratingWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  linkButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkButtonText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  commentBody: {
    marginTop: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  responseBox: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  responseTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  responseBody: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  responseMeta: {
    marginTop: spacing.sm,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
});

export function ReviewsListScreen() {
  const navigation = useNavigation<ReviewsNav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const applyPayload = useCallback((payload: PaginatedReviews | undefined, append: boolean) => {
    const nextRows = Array.isArray(payload?.data) ? payload.data : [];
    setRows((current) => (append ? [...current, ...nextRows] : nextRows));
    setPage(typeof payload?.current_page === 'number' ? payload.current_page : 1);
    setLastPage(typeof payload?.last_page === 'number' ? payload.last_page : 1);
  }, []);

  const load = useCallback(
    async (opts: { page?: number; append?: boolean; isRefresh?: boolean } = {}) => {
      const targetPage = opts.page ?? 1;
      const append = opts.append ?? false;
      const isRefresh = opts.isRefresh ?? false;
      if (isRefresh) setRefreshing(true);
      else if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      const res = await reviewsApi.listMyReviews(targetPage);
      if (isRefresh) setRefreshing(false);
      else if (append) setLoadingMore(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      applyPayload(res.data?.reviews as PaginatedReviews | undefined, append);
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
    if (loading || refreshing || loadingMore || page >= lastPage) return;
    void load({ page: page + 1, append: true });
  };

  const openProvidersList = () => {
    navigation.navigate('Providers', { screen: 'ProvidersList' });
  };

  const openProvider = (slug: string) => {
    navigation.navigate('Providers', { screen: 'ProviderDetail', params: { slug } });
  };

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>Your feedback</Text>
        <Text style={styles.title}>My reviews</Text>
        <Text style={styles.subtitle}>Reviews you have submitted to service providers.</Text>
      </View>
    ),
    []
  );

  if (loading && rows.length === 0) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading reviews…</Text>
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
        data={rows}
        keyExtractor={(item) => item.uuid}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={52} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>When you review a provider, it will appear here.</Text>
              <Pressable onPress={openProvidersList} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Find providers</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerWrap}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : (
            <View style={{ height: spacing.xl }} />
          )
        }
        contentContainerStyle={rows.length === 0 ? styles.listEmpty : styles.listContent}
        renderItem={({ item }) => <ReviewCard item={item} onOpenProvider={openProvider} />}
      />
    </AppScreen>
  );
}
