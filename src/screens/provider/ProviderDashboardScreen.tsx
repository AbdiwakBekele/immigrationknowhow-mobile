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

  const stats = dash?.stats ?? {};
  const recentLeads = dash?.recent_leads ?? [];

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: spacing.lg }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {['totalLeads', 'newLeads', 'openLeads', 'conversionRate', 'profileViews'].map((key) => (
            <StatPill key={key} label={formatStatLabel(key)} value={String(stats[key] ?? '—')} />
          ))}
        </View>

        {!dash?.subscription_checkout_configured && (
          <Text style={{ marginTop: spacing.lg, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Subscription billing is not fully configured. Complete setup in the web portal if needed.
          </Text>
        )}

        <SectionTitle title="Recent leads" />
        {recentLeads.length === 0 ? (
          <Text style={{ color: colors.text.secondary }}>No recent leads.</Text>
        ) : (
          recentLeads.map((lead) => (
            <Pressable
              key={lead.uuid}
              onPress={() =>
                navigation.navigate('Leads', { screen: 'LeadDetail', params: { uuid: lead.uuid } } as never)
              }
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {[lead.user?.first_name, lead.user?.last_name].filter(Boolean).join(' ') || 'Lead'}
              </Text>
              {!!lead.service_type && (
                <Text style={{ marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                  {lead.service_type}
                </Text>
              )}
            </Pressable>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

function formatStatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 108,
      }}
    >
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{label}</Text>
      <Text style={{ marginTop: spacing.xs, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{value}</Text>
    </View>
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
