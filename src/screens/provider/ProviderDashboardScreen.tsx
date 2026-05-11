import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { providerHeroGradient } from '../../theme/gradients';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerDashboardApi from '../../api/providerDashboardApi';
import * as authApi from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import type { ProviderTabParamList } from '../../navigation/ProviderTabs';
import type { ProviderDashboardStackParamList } from './ProviderDashboardStack';
import {
  backgroundCheckBody,
  backgroundCheckHeadline,
  formatTimeAgo,
  fullName,
  leadStatusLabel,
  leadStatusStyle,
} from '../../utils/providerUi';

const styles = StyleSheet.create({
  screenCenter: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  screenPad: {
    padding: spacing.xl,
  },
  mainScreen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  heroMeta: {
    marginTop: spacing.xs,
    color: '#dbeafe',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  subBanner: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subBannerText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  subBannerLink: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionTitleFirst: {
    marginTop: 0,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.text.secondary,
    paddingVertical: spacing.md,
  },
  leadRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leadName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  leadService: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  leadTime: {
    marginTop: spacing.xs,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
  reviewRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  reviewBody: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  statCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 148,
    flexGrow: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  statValue: {
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
  },
  statSublabel: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  statChip: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabParamList>,
  NativeStackNavigationProp<ProviderDashboardStackParamList, 'ProviderDashboardHome'>
>;

export function ProviderDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user: authUser, refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<providerDashboardApi.ProviderDashboardData | null>(null);
  const unreadNotifications = dashboard?.unread_notifications_count ?? 0;
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const emailNotVerified = !authUser?.email_verified_at;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await providerDashboardApi.getProviderDashboard();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setDashboard(res.data.dashboard);
  };

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [])
  );

  const handleSendVerification = async () => {
    setSendingVerification(true);
    const res = await authApi.sendVerificationEmail();
    setSendingVerification(false);
    if (res.success) {
      if (res.data.already_verified) {
        await refreshMe();
      } else {
        setVerificationSent(true);
      }
    }
  };

  useEffect(() => {
    // @ts-expect-error: route params shape is app-defined
    navigation.setParams?.({ unreadNotificationsCount: unreadNotifications });
  }, [navigation, unreadNotifications]);

  if (loading && !dashboard) {
    return (
      <AppScreen style={styles.screenCenter}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error && !dashboard) {
    return (
      <AppScreen style={styles.screenPad}>
        <Text style={{ color: colors.danger }}>{error}</Text>
        <Pressable onPress={() => void load(false)} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Retry</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const stats = dashboard?.stats;
  const provider = dashboard?.provider;
  const recentLeads = dashboard?.recent_leads ?? [];
  const recentReviews = dashboard?.recent_reviews ?? [];
  const bgStatus = provider?.background_check_status ?? undefined;
  const showBgBanner = !!authUser?.requires_background_check && bgStatus !== 'clear';

  return (
    <AppScreen variant="gradient" style={styles.mainScreen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={Platform.OS === 'ios' ? colors.primary[600] : undefined}
            colors={Platform.OS === 'android' ? [colors.primary[600]] : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <LinearGradient
            pointerEvents="none"
            colors={[...providerHeroGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Service provider</Text>
            <Text style={styles.heroTitle}>{provider?.business_name?.trim() || 'Dashboard'}</Text>
            {!!provider?.average_rating && (
              <Text style={styles.heroMeta}>
                {Number(provider.average_rating).toFixed(1)} rating · {provider.total_reviews ?? 0} reviews
              </Text>
            )}
            <View style={styles.heroActions}>
              <QuickAction label="Leads" onPress={() => navigation.navigate('Leads')} tone="blue" />
              <QuickAction label="Messages" onPress={() => navigation.navigate('Messages')} tone="violet" />
              <QuickAction label="Profile" onPress={() => navigation.navigate('Profile')} tone="emerald" />
            </View>
          </View>
        </View>

        {emailNotVerified && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#fde68a',
              backgroundColor: '#fffbeb',
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: '#92400e' }}>
              Verify your email address
            </Text>
            <Text style={{ marginTop: spacing.sm, color: '#a16207', lineHeight: 20 }}>
              Please verify {authUser?.email} to access all features.
              {verificationSent ? ' Check your inbox for the verification link.' : ''}
            </Text>
            <Pressable
              onPress={handleSendVerification}
              disabled={sendingVerification || verificationSent}
              style={{
                marginTop: spacing.md,
                alignSelf: 'flex-start',
                backgroundColor: verificationSent ? '#86efac' : '#b45309',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: 12,
                opacity: sendingVerification ? 0.6 : 1,
              }}
            >
              <Text style={{ color: verificationSent ? '#065f46' : colors.text.inverse, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
                {sendingVerification ? 'Sending…' : verificationSent ? 'Email sent' : 'Send verification email'}
              </Text>
            </Pressable>
          </View>
        )}

        {showBgBanner && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#fde68a',
              backgroundColor: '#fffbeb',
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: '#92400e' }}>
              {backgroundCheckHeadline(bgStatus)}
            </Text>
            {!!backgroundCheckBody(bgStatus) && (
              <Text style={{ marginTop: spacing.sm, color: '#a16207', lineHeight: 20 }}>{backgroundCheckBody(bgStatus)}</Text>
            )}
            <Pressable
              onPress={() => navigation.navigate('ProviderBackgroundCheck')}
              style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
            >
              <Text style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>Open background check</Text>
            </Pressable>
          </View>
        )}

        {stats && (
          <View style={{ marginTop: spacing['2xl'] }}>
            <SectionTitle title="Overview" first />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              <StatCard
                label="Total leads"
                value={String(stats.totalLeads ?? 0)}
                chip={typeof stats.leadsTrend === 'number' ? `${stats.leadsTrend >= 0 ? '+' : ''}${stats.leadsTrend}%` : undefined}
                trendUp={typeof stats.leadsTrend === 'number' ? stats.leadsTrend >= 0 : undefined}
              />
              <StatCard
                label="Open leads"
                value={String(stats.openLeads ?? 0)}
                sublabel={`${stats.newLeads ?? 0} new`}
              />
              <StatCard
                label="Conversion"
                value={typeof stats.conversionRate === 'number' ? `${stats.conversionRate}%` : '—'}
                sublabel="All time"
              />
              <StatCard
                label="Profile views"
                value={String(stats.profileViews ?? 0)}
                chip={typeof stats.viewsTrend === 'number' && stats.viewsTrend !== 0 ? `${stats.viewsTrend >= 0 ? '+' : ''}${stats.viewsTrend}%` : undefined}
                trendUp={typeof stats.viewsTrend === 'number' ? stats.viewsTrend >= 0 : undefined}
              />
            </View>
          </View>
        )}

        {!dashboard?.subscription_checkout_configured && (
          <View style={styles.subBanner}>
            <Text style={styles.subBannerText}>
              Subscription billing is not fully configured. You can review your plan in the app or complete setup in the web portal.
            </Text>
            <Pressable onPress={() => navigation.navigate('ProviderSubscription')} style={{ marginTop: spacing.md }}>
              <Text style={styles.subBannerLink}>Plan & subscription</Text>
            </Pressable>
          </View>
        )}

        <SectionTitle title="Recent leads" />
        <Card>
          {recentLeads.length === 0 ? (
            <Text style={styles.empty}>No recent leads yet.</Text>
          ) : (
            recentLeads.map((lead) => {
              const st = leadStatusStyle(lead.status);
              return (
                <Pressable
                  key={lead.uuid}
                  onPress={() =>
                    navigation.navigate('Leads', { screen: 'LeadDetail', params: { uuid: lead.uuid } })
                  }
                  style={styles.leadRow}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                    <Text style={styles.leadName}>{fullName(lead.user)}</Text>
                    {!!lead.status && (
                      <View
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: st.bg,
                          borderWidth: 1,
                          borderColor: st.border,
                        }}
                      >
                        <Text style={{ fontSize: typography.fontSize.xs, color: st.text, textTransform: 'capitalize' }}>
                          {leadStatusLabel(lead.status)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!lead.service_type && (
                    <Text style={styles.leadService}>{lead.service_type}</Text>
                  )}
                  {!!lead.created_at && (
                    <Text style={styles.leadTime}>{formatTimeAgo(lead.created_at)}</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </Card>

        <SectionTitle title="Recent reviews" />
        <Card>
          {recentReviews.length === 0 ? (
            <Text style={styles.empty}>No reviews yet.</Text>
          ) : (
            recentReviews.map((rev, idx) => (
              <View key={rev.id ?? idx} style={styles.reviewRow}>
                <Text style={styles.reviewTitle}>
                  {fullName(rev.user)} · {typeof rev.rating === 'number' ? `${rev.rating}/5` : '—'}
                </Text>
                {!!rev.comment?.trim() && (
                  <Text style={styles.reviewBody} numberOfLines={4}>
                    {rev.comment}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

function SectionTitle({ title, first }: { title: string; first?: boolean }) {
  return <Text style={first ? styles.sectionTitleFirst : styles.sectionTitle}>{title}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function QuickAction({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: 'blue' | 'violet' | 'emerald';
}) {
  const toneMap = {
    blue: { bg: '#dbeafe', text: '#1d4ed8' },
    violet: { bg: '#ede9fe', text: '#6d28d9' },
    emerald: { bg: '#d1fae5', text: '#047857' },
  } as const;
  const t = toneMap[tone];
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        backgroundColor: t.bg,
      }}
    >
      <Text style={{ color: t.text, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>{label}</Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  chip,
  trendUp,
}: {
  label: string;
  value: string;
  sublabel?: string;
  chip?: string;
  trendUp?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
      {!!chip && (
        <Text
          style={[
            styles.statChip,
            {
              color:
                trendUp === false ? colors.danger : trendUp === true ? '#047857' : colors.text.muted,
            },
          ]}
        >
          {chip}
        </Text>
      )}
    </View>
  );
}
