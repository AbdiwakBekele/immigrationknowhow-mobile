import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppImage } from '../../components/AppImage';
import { AppScreen } from '../../components/AppScreen';
import { AdvertiserScreenLayout } from '../../components/advertiser/AdvertiserScreenLayout';
import { useAuth } from '../../context/AuthContext';
import { useAdvertiserLayout, useAdvertiserStyles } from '../../context/AdvertiserLayoutContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { adStatusLabel, adStatusStyle, formatAdPrice } from '../../utils/adUi';
import * as adsApi from '../../api/adsApi';
import { purchaseAdPublish } from '../../services/appleIapService';
import { mapAppleIapUserMessage } from '../../utils/appleIapErrors';
import { isPaidBillingAvailable, shouldUseAppleIap } from '../../utils/platformPayments';
import type { AdsStackParamList } from './AdsStack';

type AdItem = {
  uuid: string;
  title: string;
  description?: string;
  image_url?: string | null;
  status: string;
  price_cents?: number;
  currency?: string;
  apple_product_id?: string | null;
  analytics?: { views?: number; clicks?: number; ctr?: number };
};

export function AdsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdsStackParamList>>();
  const { role } = useAuth();
  const isAdvertiserPortal = role === 'advertiser';
  const advertiserLayout = useAdvertiserLayout();
  const advertiserUi = useAdvertiserStyles();
  const seekerLayout = useResponsiveLayout();
  const listColumns = isAdvertiserPortal ? advertiserLayout.listColumns : seekerLayout.listColumns;
  const stackActions = isAdvertiserPortal ? advertiserLayout.stackActions : seekerLayout.stackActions;
  const ScreenWrap = isAdvertiserPortal ? AdvertiserScreenLayout : AppScreen;
  const screenWrapProps = isAdvertiserPortal
    ? { fill: true as const }
    : { variant: 'gradient' as const, safeAreaEdges: ['left', 'right'] as const, constrained: true as const };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingUuid, setPayingUuid] = useState<string | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [postingPrice, setPostingPrice] = useState<{
    amount_cents?: number;
    currency?: string;
    free_limit?: number;
    free_remaining?: number;
    next_ad_price_cents?: number;
    apple_product_id?: string | null;
  } | null>(null);

  const useAppleIap = shouldUseAppleIap();

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await adsApi.listAds();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) return;
    setAds(res.data?.ads ?? []);
    setPostingPrice(res.data?.ad_posting_price ?? null);
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

  const resolveAdAppleProductId = (item: AdItem): string | null => {
    const fromItem =
      typeof item.apple_product_id === 'string' && item.apple_product_id.trim() !== ''
        ? item.apple_product_id.trim()
        : null;
    if (fromItem) return fromItem;
    const fromPosting =
      typeof postingPrice?.apple_product_id === 'string' && postingPrice.apple_product_id.trim() !== ''
        ? postingPrice.apple_product_id.trim()
        : null;
    return fromPosting;
  };

  const canPayAdWithApple = (item: AdItem): boolean => {
    const priceCents = item.price_cents ?? postingPrice?.next_ad_price_cents ?? postingPrice?.amount_cents ?? 0;
    return isPaidBillingAvailable({
      priceCents,
      appleProductId: resolveAdAppleProductId(item),
    });
  };

  const startCheckout = async (item: AdItem) => {
    setPayingUuid(item.uuid);
    try {
      if (useAppleIap) {
        const appleProductId = resolveAdAppleProductId(item);
        if (!canPayAdWithApple(item)) {
          Alert.alert(
            'Ads',
            __DEV__
              ? 'Ad publish Apple product ID is missing (check APPLE_AD_PUBLISH_PRODUCT_ID).'
              : 'This ad is not available for In-App Purchase right now. Please try again later.',
          );
          return;
        }
        await purchaseAdPublish(item.uuid, appleProductId!);
        await load(true);
        Alert.alert('Ads', 'Payment received. Your ad will be reviewed before publishing.');
        return;
      }

      const res = await adsApi.checkoutAd(item.uuid);
      if (!res.success) {
        Alert.alert('Ads', res.message);
        return;
      }
      const checkoutUrl = res.data?.checkout_url;
      if (checkoutUrl) {
        navigation.navigate('StripeCheckout', { checkoutUrl, variant: 'default', adUuid: item.uuid });
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'Purchase cancelled.') {
        return;
      }
      const message = mapAppleIapUserMessage(e, 'ad-publish');
      if (message) {
        Alert.alert('Ads', message);
      }
    } finally {
      setPayingUuid(null);
    }
  };

  const publishFee = formatAdPrice(postingPrice?.amount_cents, postingPrice?.currency);
  const freeRemaining = postingPrice?.free_remaining ?? 0;
  const freeLimit = postingPrice?.free_limit ?? 0;

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>My ads</Text>
      <Text style={styles.subtitle}>
        {freeRemaining > 0
          ? `${freeRemaining} of ${freeLimit} complimentary publish ${freeRemaining === 1 ? 'slot' : 'slots'} remaining.${
              publishFee ? ` After that, ${publishFee} per ad.` : ''
            }`
          : publishFee
            ? `One-time publish fee: ${publishFee} per ad. Create, edit, and pay to publish sponsored ads.`
            : 'Create, edit, and manage your sponsored ads.'}
      </Text>
    </View>
  );

  return (
    <ScreenWrap {...screenWrapProps} style={styles.screen}>
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
          key={`ads-cols-${listColumns}`}
          style={[styles.list, isAdvertiserPortal && advertiserUi.scroll]}
          data={ads}
          keyExtractor={(a) => a.uuid}
          numColumns={listColumns}
          columnWrapperStyle={listColumns > 1 ? styles.columnRow : undefined}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[styles.listContent, isAdvertiserPortal && advertiserUi.scrollContent]}
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
              multiColumn={listColumns > 1}
              stackActions={stackActions}
              paying={payingUuid === item.uuid}
              appleBillingReady={canPayAdWithApple(item)}
              useAppleIap={useAppleIap}
              onPay={() => void startCheckout(item)}
              onEdit={() => navigation.navigate('AdsEdit', { uuid: item.uuid })}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </ScreenWrap>
  );
}

function AdCard({
  item,
  multiColumn,
  stackActions,
  paying,
  appleBillingReady,
  useAppleIap,
  onPay,
  onEdit,
  onDelete,
}: {
  item: AdItem;
  multiColumn: boolean;
  stackActions: boolean;
  paying: boolean;
  appleBillingReady: boolean;
  useAppleIap: boolean;
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
    <View style={[styles.adCard, multiColumn && styles.adCardColumn]}>
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
            <Text style={styles.previewPillText} numberOfLines={1}>
              Ad preview
            </Text>
          </View>
          <View style={[styles.statusBadge, styles.statusBadgeOverlay, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.statusBadgeText, { color: st.text }]} numberOfLines={1}>
              {adStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.adBody}>
        <Text style={styles.adTitle} numberOfLines={2}>
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

        <View style={[styles.adActionsRow, stackActions && styles.adActionsStacked]}>
          <Pressable onPress={onEdit} style={[styles.adActionSecondary, stackActions && styles.adActionFullWidth]}>
            <Ionicons name="create-outline" size={16} color={colors.primary[700]} />
            <Text style={styles.adActionSecondaryText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.adActionDanger, stackActions && styles.adActionFullWidth]}>
            <Ionicons name="trash-outline" size={16} color="#be123c" />
            <Text style={styles.adActionDangerText}>Delete</Text>
          </Pressable>
        </View>

        {item.status === 'pending_payment' ? (
          <Pressable
            onPress={onPay}
            disabled={paying || (useAppleIap && !appleBillingReady)}
            style={[
              styles.payButton,
              (paying || (useAppleIap && !appleBillingReady)) && styles.payButtonDisabled,
            ]}
          >
            {paying ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color={colors.text.inverse} />
                <Text style={styles.payButtonText}>
                  {useAppleIap && !appleBillingReady
                    ? 'Unavailable'
                    : useAppleIap
                      ? 'Pay with Apple & Publish'
                      : 'Pay & Publish'}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  columnRow: {
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  adCardColumn: {
    flex: 1,
    marginBottom: 0,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 420,
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
  pageTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
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
    width: '100%',
    maxWidth: '100%',
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
    flexShrink: 1,
    maxWidth: '48%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  statusBadgeOverlay: {
    flexShrink: 1,
    maxWidth: '48%',
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
    flexShrink: 1,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  adActionsStacked: {
    flexDirection: 'column',
  },
  adActionFullWidth: {
    flex: 0,
    width: '100%',
    minWidth: '100%',
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
    minWidth: 0,
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
