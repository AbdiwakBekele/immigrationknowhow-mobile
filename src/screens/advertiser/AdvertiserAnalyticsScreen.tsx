import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvertiserScreenLayout } from '../../components/advertiser/AdvertiserScreenLayout';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as adsApi from '../../api/adsApi';
import type { AdvertiserTabParamList } from '../../navigation/AdvertiserBottomTabs';
import type { AdvertiserAnalyticsStackParamList } from './AdvertiserAnalyticsStack';
import { useAdvertiserLayout, useAdvertiserStyles } from '../../context/AdvertiserLayoutContext';
import { adStatusLabel, adStatusStyle } from '../../utils/adUi';

type AnalyticsAd = {
  uuid: string;
  title: string;
  status: string;
  views?: number;
  clicks?: number;
  ctr?: number;
};

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AdvertiserAnalyticsStackParamList, 'AdvertiserAnalytics'>,
  BottomTabNavigationProp<AdvertiserTabParamList>
>;

export function AdvertiserAnalyticsScreen() {
  const navigation = useNavigation<Nav>();
  const { stackActions, isCompact } = useAdvertiserLayout();
  const ui = useAdvertiserStyles();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<{ views?: number; clicks?: number; ctr?: number } | null>(null);
  const [ads, setAds] = useState<AnalyticsAd[]>([]);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await adsApi.getAdsAnalytics();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) return;
    setSummary(res.data?.summary ?? null);
    setAds(res.data?.ads ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const maxViews = useMemo(() => Math.max(1, ...ads.map((a) => Number(a.views ?? 0))), [ads]);
  const maxClicks = useMemo(() => Math.max(1, ...ads.map((a) => Number(a.clicks ?? 0))), [ads]);

  const goManageAds = () => {
    navigation.navigate('MyAds', { screen: 'AdsHome' });
  };

  if (loading && !refreshing) {
    return (
      <AdvertiserScreenLayout style={styles.centered}>
        <ActivityIndicator color={colors.primary[600]} />
      </AdvertiserScreenLayout>
    );
  }

  return (
    <AdvertiserScreenLayout>
      <ScrollView
        style={ui.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={ui.scrollContent}
      >
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Ad analytics</Text>
          <Text style={styles.introSubtitle}>Performance overview across all your ads.</Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryStat label="Total views" value={String(summary?.views ?? 0)} compact={isCompact} />
          <SummaryStat label="Total clicks" value={String(summary?.clicks ?? 0)} compact={isCompact} />
          <SummaryStat label="Overall CTR" value={`${summary?.ctr ?? 0}%`} compact={isCompact} />
        </View>

        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, isCompact && styles.sectionHeaderCompact]}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Per-ad performance</Text>
              <Text style={styles.sectionSubtitle}>Views, clicks, and CTR at a glance.</Text>
            </View>
            <Pressable onPress={goManageAds}>
              <Text style={styles.manageLink}>Manage ads</Text>
            </Pressable>
          </View>

          {ads.length === 0 ? (
            <Text style={styles.empty}>No ad analytics yet.</Text>
          ) : (
            ads.map((ad) => {
              const st = adStatusStyle(ad.status);
              const views = Number(ad.views ?? 0);
              const clicks = Number(ad.clicks ?? 0);
              return (
                <View key={ad.uuid} style={styles.adRow}>
                  <View style={[styles.adRowHead, isCompact && styles.adRowHeadCompact]}>
                    <Text style={styles.adTitle} numberOfLines={2}>
                      {ad.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                      <Text style={[styles.statusBadgeText, { color: st.text }]}>{adStatusLabel(ad.status)}</Text>
                    </View>
                  </View>

                  <MetricBar label="Views" value={views} max={maxViews} color="#0ea5e9" />
                  <MetricBar label="Clicks" value={clicks} max={maxClicks} color="#059669" />
                  <View style={styles.ctrRow}>
                    <Text style={styles.metricLabel}>CTR</Text>
                    <Text style={styles.ctrValue}>{ad.ctr ?? 0}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </AdvertiserScreenLayout>
  );
}

function SummaryStat({ label, value, compact }: { label: string; value: string; compact: boolean }) {
  return (
    <View style={[styles.summaryStat, compact && styles.summaryStatCompact]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MetricBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={styles.metricBlock}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  introSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryStat: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 100,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  summaryStatCompact: {
    width: '100%',
    minWidth: '100%',
    flexGrow: 0,
  },
  summaryValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionCard: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  manageLink: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  empty: {
    padding: spacing.lg,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  adRow: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  adRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  adRowHeadCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  adTitle: {
    flex: 1,
    minWidth: 0,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
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
  metricBlock: {
    marginTop: spacing.xs,
  },
  metricHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  metricValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  barTrack: {
    marginTop: spacing.xs,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  ctrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctrValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
});
