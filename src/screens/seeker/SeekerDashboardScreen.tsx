import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as seekerDashboardApi from '../../api/seekerDashboardApi';

type LeadRow = {
  uuid: string;
  service_type?: string;
  service_provider?: { slug?: string; business_name?: string | null };
  conversation?: { uuid: string } | null;
};

export function SeekerDashboardScreen() {
  const navigation = useNavigation();

  const openProviderDetail = (slug: string) => {
    // Parent of this stack is the bottom tabs; navigate into Discover → Providers flow.
    // @ts-expect-error: app-defined route names
    navigation.getParent()?.navigate('Discover', { screen: 'Providers', params: { screen: 'ProviderDetail', params: { slug } } });
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dash, setDash] = useState<seekerDashboardApi.SeekerDashboardData | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await seekerDashboardApi.getSeekerDashboard();
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

  const onRefresh = () => void load(true);

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
  const recentLeads = (dash?.recent_leads ?? []) as LeadRow[];
  const recentMessages = dash?.recent_messages ?? [];
  const recommended = dash?.recommended_providers ?? [];
  const libraryItems = (dash?.library_items ?? []) as Array<{ uuid: string; title?: string; type?: string }>;
  const purchasedItems = (dash?.purchased_items ?? []) as Array<{
    item?: { title?: string; uuid?: string };
  }>;

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {stats && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.md,
              marginTop: spacing.lg,
            }}
          >
            <StatPill label="Leads" value={String(stats.totalLeads)} />
            <StatPill label="Unread" value={String(stats.unreadMessages)} />
            <StatPill label="Profile" value={`${stats.profileCompletion}%`} />
          </View>
        )}

        <SectionTitle title="Recommended providers" />
        {recommended.length === 0 ? (
          <Text style={{ color: colors.text.secondary }}>Browse the marketplace to find providers.</Text>
        ) : (
          <FlatList
            horizontal
            data={recommended}
            keyExtractor={(p) => p.slug}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openProviderDetail(item.slug)}
                style={{
                  width: 220,
                  padding: spacing.lg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }} numberOfLines={2}>
                  {item.business_name ?? 'Provider'}
                </Text>
                <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.sm }} numberOfLines={1}>
                  {item.location_display}
                </Text>
              </Pressable>
            )}
          />
        )}

        <SectionTitle title="Recent leads" />
        {recentLeads.length === 0 ? (
          <Text style={{ color: colors.text.secondary }}>No leads yet.</Text>
        ) : (
          recentLeads.map((lead) => (
            <Pressable
              key={lead.uuid}
              onPress={() => {
                const slug = lead.service_provider?.slug;
                if (slug) {
                  openProviderDetail(slug);
                }
              }}
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
                {lead.service_provider?.business_name ?? 'Lead'}
              </Text>
              {!!lead.service_type && (
                <Text style={{ marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                  {lead.service_type}
                </Text>
              )}
            </Pressable>
          ))
        )}

        {libraryItems.length > 0 && (
          <>
            <SectionTitle title="Featured library" />
            {libraryItems.map((item) => (
              <View
                key={item.uuid}
                style={{
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{item.title ?? 'Item'}</Text>
                {!!item.type && (
                  <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.sm }}>{item.type}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {purchasedItems.length > 0 && (
          <>
            <SectionTitle title="Your library" />
            {purchasedItems.map((row, idx) => (
              <View
                key={row.item?.uuid ?? String(idx)}
                style={{
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ color: colors.text.primary }}>{row.item?.title ?? 'Purchase'}</Text>
              </View>
            ))}
          </>
        )}

        <SectionTitle title="Recent messages" />
        {recentMessages.length === 0 ? (
          <Text style={{ color: colors.text.secondary }}>No messages yet.</Text>
        ) : (
          recentMessages.map((m) => (
            <Pressable
              key={m.uuid}
              onPress={() => {
                if (m.conversation_uuid) {
                  navigation.navigate('Messages', { screen: 'Chat', params: { uuid: m.conversation_uuid } });
                }
              }}
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text.primary }} numberOfLines={3}>
                {m.body ?? ''}
              </Text>
            </Pressable>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 100,
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
