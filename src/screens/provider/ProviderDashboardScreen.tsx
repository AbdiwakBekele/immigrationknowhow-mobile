import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerDashboardApi from '../../api/providerDashboardApi';
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

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProviderDashboardStackParamList, 'ProviderDashboardHome'>,
  BottomTabNavigationProp<ProviderTabParamList>
>;

export function ProviderDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dash, setDash] = useState<providerDashboardApi.ProviderDashboardData | null>(null);
  const unreadNotifications = dash?.unread_notifications_count ?? 0;

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
    setDash(res.data.dashboard);
  };

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [])
  );

  useEffect(() => {
    // @ts-expect-error: route params shape is app-defined
    navigation.setParams?.({ unreadNotificationsCount: unreadNotifications });
  }, [navigation, unreadNotifications]);

  if (loading && !dash) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error && !dash) {
    return (
      <AppScreen style={{ padding: spacing.xl }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
        <Pressable onPress={() => void load(false)} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Retry</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const stats = dash?.stats;
  const provider = dash?.provider;
  const recentLeads = dash?.recent_leads ?? [];
  const recentReviews = dash?.recent_reviews ?? [];
  const bgStatus = provider?.background_check_status ?? undefined;
  const showBgBanner = bgStatus !== 'clear';

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: spacing.sm }}
      >
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#1e3a8a',
            backgroundColor: '#0f172a',
            padding: spacing.xl,
          }}
        >
          <Text style={{ fontSize: typography.fontSize.xs, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Service provider
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.inverse,
            }}
          >
            {provider?.business_name?.trim() || 'Dashboard'}
          </Text>
          {!!provider?.average_rating && (
            <Text style={{ marginTop: spacing.xs, color: '#dbeafe' }}>
              {Number(provider.average_rating).toFixed(1)} rating · {provider.total_reviews ?? 0} reviews
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <QuickAction label="Leads" onPress={() => navigation.navigate('Leads')} tone="blue" />
            <QuickAction label="Messages" onPress={() => navigation.navigate('Messages')} tone="violet" />
            <QuickAction label="Profile" onPress={() => navigation.navigate('Profile')} tone="emerald" />
          </View>
        </View>

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
            <SectionTitle title="Overview" />
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

        {!dash?.subscription_checkout_configured && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm, lineHeight: 20 }}>
              Subscription billing is not fully configured. You can review your plan in the app or complete setup in the web portal.
            </Text>
            <Pressable onPress={() => navigation.navigate('ProviderSubscription')} style={{ marginTop: spacing.md }}>
              <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Plan & subscription</Text>
            </Pressable>
          </View>
        )}

        <SectionTitle title="Recent leads" />
        <Card>
          {recentLeads.length === 0 ? (
            <Text style={{ color: colors.text.secondary }}>No recent leads yet.</Text>
          ) : (
            recentLeads.map((lead) => {
              const st = leadStatusStyle(lead.status);
              return (
                <Pressable
                  key={lead.uuid}
                  onPress={() =>
                    navigation.navigate('Leads', { screen: 'LeadDetail', params: { uuid: lead.uuid } } as never)
                  }
                  style={{
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                    <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, flex: 1 }}>
                      {fullName(lead.user)}
                    </Text>
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
                    <Text style={{ marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                      {lead.service_type}
                    </Text>
                  )}
                  {!!lead.created_at && (
                    <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.xs }}>
                      {formatTimeAgo(lead.created_at)}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </Card>

        <SectionTitle title="Recent reviews" />
        <Card>
          {recentReviews.length === 0 ? (
            <Text style={{ color: colors.text.secondary }}>No reviews yet.</Text>
          ) : (
            recentReviews.map((rev, idx) => (
              <View
                key={rev.id ?? idx}
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                  {fullName(rev.user)} · {typeof rev.rating === 'number' ? `${rev.rating}/5` : '—'}
                </Text>
                {!!rev.comment?.trim() && (
                  <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }} numberOfLines={4}>
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

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        marginTop: spacing['2xl'],
        marginBottom: spacing.md,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
      }}
    >
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
      }}
    >
      {children}
    </View>
  );
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
    <View
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 148,
        flexGrow: 1,
      }}
    >
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{label}</Text>
      <Text style={{ marginTop: spacing.xs, fontWeight: typography.fontWeight.bold, color: colors.text.primary, fontSize: typography.fontSize.xl }}>
        {value}
      </Text>
      {!!sublabel && (
        <Text style={{ marginTop: 4, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>{sublabel}</Text>
      )}
      {!!chip && (
        <Text
          style={{
            marginTop: spacing.sm,
            fontSize: typography.fontSize.xs,
            color: trendUp === false ? colors.danger : trendUp === true ? '#047857' : colors.text.muted,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          {chip}
        </Text>
      )}
    </View>
  );
}
