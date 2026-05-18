import React, { useCallback, useState } from 'react';
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
import type { SeekerBottomTabParamList } from '../../navigation/SeekerBottomTabs';
import type { SeekerDashboardStackParamList } from './SeekerDashboardStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as seekerDashboardApi from '../../api/seekerDashboardApi';
import * as authApi from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

type SeekerDashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<SeekerBottomTabParamList>,
  NativeStackNavigationProp<SeekerDashboardStackParamList, 'SeekerDashboardHome'>
>;

type LeadRow = {
  uuid: string;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  service_type?: string;
  service_provider?: { slug?: string; business_name?: string | null };
  conversation?: { uuid: string } | null;
};

type ConversationPreviewRow = seekerDashboardApi.SeekerDashboardData['recent_messages'][number];

const styles = StyleSheet.create({
  loadingScreen: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  errorScreen: {
    padding: spacing.xl,
  },
  screen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  hero: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.35)',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  heroKicker: {
    fontSize: typography.fontSize.xs,
    color: '#bfdbfe',
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  heroBody: {
    marginTop: spacing.xs,
    color: '#dbeafe',
    lineHeight: 20,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipText: {
    color: '#eff6ff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  actionGrid: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '47.8%',
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe2ef',
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  actionTitle: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
  actionBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  sectionTitle: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statPill: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe2ef',
    minWidth: 102,
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
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe2ef',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 1,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  rowBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  rowMeta: {
    marginTop: spacing.xs,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
  empty: {
    color: colors.text.secondary,
    paddingVertical: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  providerCard: {
    width: 228,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe2ef',
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  providerCardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  providerCardBody: {
    marginTop: spacing.xs,
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
  },
});

export function SeekerDashboardScreen() {
  const navigation = useNavigation<SeekerDashboardNav>();
  const { user, refreshMe } = useAuth();

  const openProvidersList = () => {
    navigation.navigate('Discover', { screen: 'Providers' });
  };

  const openSavedProviders = () => {
    navigation.navigate('Discover', {
      screen: 'Providers',
      params: { screen: 'ProvidersList', params: { favoritesOnly: true } },
    });
  };

  const openProviderDetail = (slug: string) => {
    navigation.navigate('Discover', {
      screen: 'Providers',
      params: { screen: 'ProviderDetail', params: { slug } },
    });
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dash, setDash] = useState<seekerDashboardApi.SeekerDashboardData | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const emailNotVerified = !user?.email_verified_at;

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

  if (loading && !dash) {
    return (
      <AppScreen style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error && !dash) {
    return (
      <AppScreen style={styles.errorScreen}>
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
  const savedProviders = dash?.saved_providers ?? [];
  const libraryItems = (dash?.library_items ?? []) as Array<{ uuid: string; title?: string; type?: string }>;
  const purchasedItems = (dash?.purchased_items ?? []) as Array<{
    item?: { title?: string; uuid?: string };
  }>;
  const firstName = user?.first_name?.trim() || 'there';
  const profileCompletion = stats?.profileCompletion ?? 0;
  const profileTone = profileCompletion >= 90 ? 'Almost done' : profileCompletion >= 60 ? 'Great progress' : 'Keep going';

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Platform.OS === 'ios' ? colors.primary[600] : undefined}
            colors={Platform.OS === 'android' ? [colors.primary[600]] : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={['#1d4ed8', '#2563eb', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Text style={styles.heroKicker}>Seeker dashboard</Text>
          <Text style={styles.heroTitle}>Welcome back, {firstName}!</Text>
          <Text style={styles.heroBody}>Here is what is happening with your immigration journey.</Text>
          <View style={styles.heroChips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{profileCompletion}% complete</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{profileTone}</Text>
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
              Please verify {user?.email} to access all features.
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

        <View style={styles.actionGrid}>
          <ActionCard
            title="Find providers"
            subtitle="Search for services"
            onPress={openProvidersList}
          />
          <ActionCard title="Saved" subtitle="Your shortlist" onPress={openSavedProviders} />
          <ActionCard title="Messages" subtitle={`${stats?.unreadMessages ?? 0} unread`} onPress={() => navigation.navigate('Messages')} />
          <ActionCard
            title="Contracts"
            subtitle="Offers & agreements"
            onPress={() => navigation.navigate('Discover', { screen: 'Contracts' })}
          />
          <ActionCard title="Library" subtitle="E-books & audiobooks" onPress={() => navigation.navigate('Discover', { screen: 'Library' })} />
          <ActionCard title="Profile" subtitle="Update your info" onPress={() => navigation.navigate('Profile')} />
          <ActionCard title="Community" subtitle="Join discussions" onPress={() => navigation.navigate('Discover', { screen: 'Community' })} />
          <ActionCard
            title="Contracts"
            subtitle="Offers & agreements"
            onPress={() => navigation.navigate('Discover', { screen: 'Contracts' })}
          />
        </View>

        {profileCompletion < 100 && (
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#BFDBFE',
              backgroundColor: '#EFF6FF',
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: '#1E40AF' }}>
              Complete your profile ({profileCompletion}%)
            </Text>
            <Text style={{ marginTop: spacing.xs, color: '#3B82F6', fontSize: typography.fontSize.sm, lineHeight: 20 }}>
              Add details so providers can match you faster — same as the web profile page.
            </Text>
          </Pressable>
        )}

        {stats && (
          <>
            <SectionTitle title="Overview" />
            <View style={styles.statsGrid}>
              <StatPill label="Leads" value={String(stats.totalLeads)} />
              <StatPill label="Unread" value={String(stats.unreadMessages)} />
              <StatPill label="Profile" value={`${stats.profileCompletion}%`} />
            </View>
          </>
        )}

        <SectionTitle title="Saved providers" />
        {savedProviders.length === 0 ? (
          <Text style={styles.empty}>Save providers from Discover to keep a shortlist here.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
            {savedProviders.map((item) => (
              <ProviderCard
                key={item.slug}
                title={item.business_name ?? 'Provider'}
                subtitle={item.location_display ?? ''}
                onPress={() => openProviderDetail(item.slug)}
              />
            ))}
          </ScrollView>
        )}

        <SectionTitle title="Recommended for you" />
        {recommended.length === 0 ? (
          <Text style={styles.empty}>Browse the marketplace to find providers.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
            {recommended.map((item) => (
              <ProviderCard
                key={item.slug}
                title={item.business_name ?? 'Provider'}
                subtitle={item.location_display ?? ''}
                onPress={() => openProviderDetail(item.slug)}
              />
            ))}
          </ScrollView>
        )}

        <SectionTitle title="Your inquiries" />
        <Card>
          {recentLeads.length === 0 ? (
            <Text style={styles.empty}>No inquiries yet.</Text>
          ) : (
            recentLeads.map((lead, idx) => {
              const st = statusStyle(lead.status);
              return (
                <Pressable key={lead.uuid} onPress={() => lead.service_provider?.slug && openProviderDetail(lead.service_provider.slug)} style={[styles.row, idx === recentLeads.length - 1 ? styles.rowLast : null]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                    <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>
                      {lead.service_provider?.business_name ?? 'Inquiry'}
                    </Text>
                    {!!lead.status && (
                      <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                        <Text style={[styles.statusText, { color: st.text }]}>{lead.status}</Text>
                      </View>
                    )}
                  </View>
                  {!!lead.message?.trim() && (
                    <Text style={styles.rowBody} numberOfLines={2}>
                      {lead.message}
                    </Text>
                  )}
                  {!!lead.service_type && (
                    <Text style={styles.rowBody} numberOfLines={1}>
                      {lead.service_type}
                    </Text>
                  )}
                  {!!lead.created_at && <Text style={styles.rowMeta}>{formatTimeAgo(lead.created_at)}</Text>}
                </Pressable>
              );
            })
          )}
        </Card>

        {libraryItems.length > 0 && (
          <>
            <SectionTitle title="From the library" />
            <Card>
              {libraryItems.map((item, idx) => (
                <SimpleRow key={item.uuid} title={item.title ?? 'Item'} subtitle={item.type} isLast={idx === libraryItems.length - 1} />
              ))}
            </Card>
          </>
        )}

        {purchasedItems.length > 0 && (
          <>
            <SectionTitle title="Your purchases" />
            <Card>
              {purchasedItems.map((row, idx) => (
                <SimpleRow
                  key={row.item?.uuid ?? String(idx)}
                  title={row.item?.title ?? 'Purchase'}
                  isLast={idx === purchasedItems.length - 1}
                />
              ))}
            </Card>
          </>
        )}

        <SectionTitle title="Recent messages" />
        <Card>
          {recentMessages.length === 0 ? (
            <Text style={styles.empty}>No messages yet.</Text>
          ) : (
            recentMessages.map((m, idx) => (
              <SimpleRow
                key={m.uuid}
                title={messagePreviewTitle(m)}
                subtitle={m.latest_message?.body ?? ''}
                meta={m.last_message_at ? formatTimeAgo(m.last_message_at) : undefined}
                isLast={idx === recentMessages.length - 1}
                onPress={() => {
                  navigation.navigate('Messages', { screen: 'Chat', params: { uuid: m.uuid } });
                }}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function ActionCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.actionCard}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{subtitle}</Text>
    </Pressable>
  );
}

function ProviderCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.providerCard}>
      <Text style={styles.providerCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.providerCardBody} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function SimpleRow({
  title,
  subtitle,
  meta,
  onPress,
  isLast,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const body = (
    <View style={[styles.row, isLast ? styles.rowLast : null]}>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.rowBody} numberOfLines={3}>
          {subtitle}
        </Text>
      )}
      {!!meta && <Text style={styles.rowMeta}>{meta}</Text>}
    </View>
  );
  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

function statusStyle(status?: string | null) {
  switch ((status ?? '').toLowerCase()) {
    case 'new':
      return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
    case 'contacted':
      return { bg: '#fef9c3', border: '#fde68a', text: '#a16207' };
    case 'in_progress':
      return { bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9' };
    case 'converted':
      return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
    case 'declined':
      return { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' };
    default:
      return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' };
  }
}

function messagePreviewTitle(row: ConversationPreviewRow) {
  const firstName = row.provider_user?.first_name?.trim() ?? '';
  const lastName = row.provider_user?.last_name?.trim() ?? '';
  return [firstName, lastName].filter(Boolean).join(' ') || (row.subject ?? '').trim() || 'Conversation';
}

function formatTimeAgo(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}
