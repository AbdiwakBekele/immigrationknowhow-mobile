import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppImage } from '../../components/AppImage';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import * as adsApi from '../../api/adsApi';
import type { AdsStackParamList } from './AdsStack';

type AdsSummary = {
  views?: number;
  clicks?: number;
  ctr?: number;
};

type AdItem = {
  uuid: string;
  title: string;
  description?: string;
  image_url?: string | null;
  status: string;
  price_cents?: number;
  currency?: string;
  analytics?: { views?: number; clicks?: number; ctr?: number };
};

function adStatusLabel(status: string): string {
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

function adStatusStyle(status: string): { bg: string; text: string; border: string } {
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

function formatAdPrice(cents?: number, currency?: string): string | null {
  if (cents == null) return null;
  const code = (currency ?? 'USD').toUpperCase();
  return `${code} ${(cents / 100).toFixed(2)}`;
}

export function AdsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingUuid, setPayingUuid] = useState<string | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [summary, setSummary] = useState<AdsSummary | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const [res, ares] = await Promise.all([adsApi.listAds(), adsApi.getAdsAnalytics()]);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) return;
    setAds(res.data?.ads ?? []);
    if (ares.success) setSummary(ares.data?.summary ?? null);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const confirmDelete = (item: AdItem) => {
    const extra = item.status === 'published' ? ' This ad is currently live and will be removed immediately.' : '';
    Alert.alert('Delete ad', `Delete "${item.title}"?${extra}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const res = await adsApi.deleteAd(item.uuid);
            if (!res.success) {
              Alert.alert('Ads', res.message);
              return;
            }
            void load(true);
          })();
        },
      },
    ]);
  };

  const startCheckout = async (uuid: string) => {
    setPayingUuid(uuid);
    const res = await adsApi.checkoutAd(uuid);
    setPayingUuid(null);
    if (!res.success) {
      Alert.alert('Ads', res.message);
      return;
    }
    const checkoutUrl = res.data?.checkout_url;
    if (checkoutUrl) {
      navigation.navigate('StripeCheckout', { checkoutUrl, variant: 'default', adUuid: uuid });
    }
  };

  const ctrDisplay = summary?.ctr != null ? `${summary.ctr}%` : '—';

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.subtitle}>Track performance across all your sponsored ads.</Text>
      {summary ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <MiniStat label="Views" value={String(summary.views ?? 0)} accent="#0ea5e9" />
          <MiniStat label="Clicks" value={String(summary.clicks ?? 0)} accent="#059669" />
          <MiniStat label="CTR" value={ctrDisplay} accent={colors.primary[600]} />
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : ads.length === 0 ? (
        <View style={styles.emptyScreen}>
          {listHeader}
          <View style={styles.emptyCenter}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="megaphone-outline" size={48} color={colors.primary[600]} />
              </View>
              <Text style={styles.emptyTitle}>No ads yet</Text>
              <Text style={styles.emptyText}>
                Create a sponsored ad to promote your services and track views, clicks, and CTR.
              </Text>
              <Pressable onPress={() => navigation.navigate('AdsCreate')} style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Ad</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={ads}
          keyExtractor={(a) => a.uuid}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          ListFooterComponent={
            <Pressable onPress={() => navigation.navigate('AdsCreate')} style={[styles.createButton, styles.createButtonFooter]}>
              <Ionicons name="add" size={20} color={colors.text.inverse} />
              <Text style={styles.createButtonText}>Create Ad</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <AdCard
              item={item}
              paying={payingUuid === item.uuid}
              onPay={() => void startCheckout(item.uuid)}
              onEdit={() => navigation.navigate('AdsEdit', { uuid: item.uuid })}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </AppScreen>
  );
}

function AdCard({
  item,
  paying,
  onPay,
  onEdit,
  onDelete,
}: {
  item: AdItem;
  paying: boolean;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const st = adStatusStyle(item.status);
  const price = formatAdPrice(item.price_cents, item.currency);
  const views = item.analytics?.views ?? 0;
  const clicks = item.analytics?.clicks ?? 0;
  const ctr = item.analytics?.ctr ?? 0;

  return (
    <View style={styles.adCard}>
      <View style={styles.adMedia}>
        {item.image_url ? (
          <AppImage uri={resolveMediaUrl(item.image_url)} style={styles.adImage} contentFit="cover" height={160} />
        ) : (
          <View style={styles.adImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.text.muted} />
            <Text style={styles.adImagePlaceholderText}>No cover image</Text>
          </View>
        )}
        <View style={styles.adMediaOverlay}>
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>Ad preview</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.statusBadgeText, { color: st.text }]}>{adStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.adBody}>
        <Text style={styles.adTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {!!item.description && (
          <Text style={styles.adDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {price ? <Text style={styles.adPrice}>{price} publish fee</Text> : null}

        {item.status === 'suspended' ? (
          <View style={styles.suspendedNotice}>
            <Text style={styles.suspendedNoticeText}>
              Suspended by an administrator. This ad is hidden from the public site.
            </Text>
          </View>
        ) : null}

        <View style={styles.adMetricsGrid}>
          <View style={styles.adMetricCell}>
            <Text style={styles.adMetricLabel}>Views</Text>
            <Text style={[styles.adMetricValue, { color: '#0ea5e9' }]}>{views}</Text>
          </View>
          <View style={styles.adMetricDivider} />
          <View style={styles.adMetricCell}>
            <Text style={styles.adMetricLabel}>Clicks</Text>
            <Text style={[styles.adMetricValue, { color: '#059669' }]}>{clicks}</Text>
          </View>
          <View style={styles.adMetricDivider} />
          <View style={styles.adMetricCell}>
            <Text style={styles.adMetricLabel}>CTR</Text>
            <Text style={[styles.adMetricValue, { color: colors.primary[600] }]}>{ctr}%</Text>
          </View>
        </View>

        <View style={styles.adActionsRow}>
          <Pressable onPress={onEdit} style={styles.adActionSecondary}>
            <Ionicons name="create-outline" size={16} color={colors.primary[700]} />
            <Text style={styles.adActionSecondaryText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.adActionDanger}>
            <Ionicons name="trash-outline" size={16} color="#be123c" />
            <Text style={styles.adActionDangerText}>Delete</Text>
          </Pressable>
        </View>

        {item.status === 'pending_payment' ? (
          <Pressable
            onPress={onPay}
            disabled={paying}
            style={[styles.payButton, paying && styles.payButtonDisabled]}
          >
            {paying ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color={colors.text.inverse} />
                <Text style={styles.payButtonText}>Pay & Publish</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={[styles.miniStatValue, { color: accent ?? colors.text.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  emptyScreen: {
    flex: 1,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  emptyCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  statsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  miniStat: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 96,
    ...shadows.soft,
  },
  miniStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  miniStatValue: {
    marginTop: 2,
    fontWeight: typography.fontWeight.bold,
  },
  createButton: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  createButtonFooter: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  createButtonText: {
    color: colors.text.inverse,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
  },
  adCard: {
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.soft,
  },
  adMedia: {
    position: 'relative',
  },
  adImage: {
    width: '100%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  adImagePlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xs,
  },
  adImagePlaceholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  adMediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  previewPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  previewPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  adBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  adTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  adDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  adPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suspendedNotice: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  suspendedNoticeText: {
    fontSize: typography.fontSize.sm,
    color: '#5b21b6',
    lineHeight: 20,
  },
  adMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
  },
  adMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  adMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  adMetricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  adMetricValue: {
    marginTop: 2,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  adActionsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  adActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  adActionSecondaryText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  adActionDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  adActionDangerText: {
    color: '#be123c',
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  payButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
});
