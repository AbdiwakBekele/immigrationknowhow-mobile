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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AdvertiserScreenLayout } from '../../components/advertiser/AdvertiserScreenLayout';
import { colors } from '../../theme/colors';
import { providerHeroGradient } from '../../theme/gradients';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as adsApi from '../../api/adsApi';
import { useAuth } from '../../context/AuthContext';
import type { AdvertiserTabParamList } from '../../navigation/AdvertiserBottomTabs';
import type { AdvertiserDashboardStackParamList } from './AdvertiserDashboardStack';
import { useAdvertiserLayout, useAdvertiserStyles } from '../../context/AdvertiserLayoutContext';
import { adStatusLabel, adStatusStyle } from '../../utils/adUi';

type RecentAd = {
  uuid: string;
  title: string;
  status: string;
  analytics?: { views?: number; clicks?: number; ctr?: number };
};

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AdvertiserDashboardStackParamList, 'AdvertiserDashboardHome'>,
  BottomTabNavigationProp<AdvertiserTabParamList>
>;

export function AdvertiserDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { statCardMinWidthPercent, heroTitleSize, stackActions } = useAdvertiserLayout();
  const ui = useAdvertiserStyles();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentAds, setRecentAds] = useState<RecentAd[]>([]);
  const [stats, setStats] = useState({
    total_ads: 0,
    published_ads: 0,
    views: 0,
    clicks: 0,
    ctr: 0,
  });

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const [listRes, analyticsRes] = await Promise.all([adsApi.listAds(), adsApi.getAdsAnalytics()]);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!listRes.success) return;

    const ads = (listRes.data?.ads ?? []) as RecentAd[];
    const summary = analyticsRes.success ? analyticsRes.data?.summary : null;
    setRecentAds(ads.slice(0, 6));
    setStats({
      total_ads: ads.length,
      published_ads: ads.filter((a) => a.status === 'published').length,
      views: summary?.views ?? 0,
      clicks: summary?.clicks ?? 0,
      ctr: summary?.ctr ?? 0,
    });
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const firstName = useMemo(() => user?.first_name?.trim() || 'there', [user?.first_name]);
  const viewsClicks = `${stats.views} / ${stats.clicks}`;

  const goMyAds = () => navigation.navigate('MyAds', { screen: 'AdsHome' });
  const goCreateAd = () => navigation.navigate('MyAds', { screen: 'AdsCreate' });
  const goAnalytics = () => navigation.navigate('Analytics');
  const goEditAd = (uuid: string) => navigation.navigate('MyAds', { screen: 'AdsEdit', params: { uuid } });

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
        <View style={styles.hero}>
          <LinearGradient colors={[...providerHeroGradient]} style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Advertiser portal</Text>
            <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>Hi, {firstName}</Text>
            <Text style={styles.heroMeta}>Manage paid ad publishing and performance in one place.</Text>
            <View style={[styles.heroActions, stackActions && styles.heroActionsStack]}>
              <Pressable onPress={goCreateAd} style={styles.heroBtnPrimary}>
                <Ionicons name="add" size={18} color={colors.text.inverse} />
                <Text style={styles.heroBtnPrimaryText}>New ad</Text>
              </Pressable>
              <Pressable onPress={goAnalytics} style={styles.heroBtnSecondary}>
                <Text style={styles.heroBtnSecondaryText}>Analytics</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total ads" value={String(stats.total_ads)} minWidth={statCardMinWidthPercent} />
          <StatCard label="Published ads" value={String(stats.published_ads)} minWidth={statCardMinWidthPercent} />
          <StatCard label="Views / Clicks" value={viewsClicks} minWidth={statCardMinWidthPercent} />
          <StatCard label="CTR" value={`${stats.ctr}%`} minWidth={statCardMinWidthPercent} />
        </View>

        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent ads</Text>
            <Pressable onPress={goMyAds}>
              <Text style={styles.recentLink}>View all</Text>
            </Pressable>
          </View>

          {recentAds.length === 0 ? (
            <Text style={styles.empty}>No ads yet. Create your first ad to begin.</Text>
          ) : (
            recentAds.map((ad) => {
              const st = adStatusStyle(ad.status);
              const views = ad.analytics?.views ?? 0;
              const clicks = ad.analytics?.clicks ?? 0;
              const ctr = ad.analytics?.ctr ?? 0;
              return (
                <Pressable key={ad.uuid} onPress={() => goEditAd(ad.uuid)} style={styles.recentRow}>
                  <View style={styles.recentRowMain}>
                    <Text style={styles.recentAdTitle} numberOfLines={1}>
                      {ad.title}
                    </Text>
                    <Text style={styles.recentAdMeta}>
                      {views} views • {clicks} clicks • CTR {ctr}%
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[styles.statusBadgeText, { color: st.text }]}>{adStatusLabel(ad.status)}</Text>
                  </View>
                </Pressable>
              );
            })
          )}

          <Pressable onPress={goCreateAd} style={styles.createFooter}>
            <Ionicons name="megaphone-outline" size={18} color={colors.primary[700]} />
            <Text style={styles.createFooterText}>Create ad</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AdvertiserScreenLayout>
  );
}

function StatCard({ label, value, minWidth }: { label: string; value: string; minWidth: string }) {
  return (
    <View style={[styles.statCard, { minWidth }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.xs,
    paddingBottom: 0,
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
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.45)',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroKicker: {
    fontSize: typography.fontSize.xs,
    color: '#bfdbfe',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  heroMeta: {
    marginTop: spacing.xs,
    color: '#dbeafe',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroActionsStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    width: '100%',
  },
  heroBtnPrimaryText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  heroBtnSecondary: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
  },
  heroBtnSecondaryText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValue: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  recentCard: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.soft,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  recentLink: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  empty: {
    padding: spacing.lg,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentRowMain: {
    flex: 1,
    minWidth: 0,
  },
  recentAdTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  recentAdMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexShrink: 0,
    maxWidth: '42%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  createFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createFooterText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
});
