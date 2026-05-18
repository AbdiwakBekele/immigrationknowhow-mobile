import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { PicklistField } from '../onboarding/components/PicklistField';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerLeadsApi from '../../api/providerLeadsApi';
import type { LeadsStackParamList } from './LeadsStack';
import { formatTimeAgo, fullName, leadStatusLabel, leadStatusStyle, urgencyLabel } from '../../utils/providerUi';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
  { value: 'declined', label: 'Declined' },
];

const URGENCY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function LeadsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LeadsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<providerLeadsApi.ProviderLead[]>([]);
  const [stats, setStats] = useState<Record<string, string | number> | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [urgency, setUrgency] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await providerLeadsApi.listProviderLeads({
      search: debouncedSearch || undefined,
      status: status || undefined,
      urgency: urgency || undefined,
    });
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    const page = res.data.leads as { data?: providerLeadsApi.ProviderLead[] };
    setItems(page?.data ?? []);
    setStats(res.data.stats ?? null);
  }, [debouncedSearch, status, urgency]);

  const skipNextFocusRef = useRef(true);

  useEffect(() => {
    void fetchLeads(false);
  }, [fetchLeads]);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRef.current) {
        skipNextFocusRef.current = false;
        return;
      }
      void fetchLeads(true);
    }, [fetchLeads])
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      {loading && !refreshing && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error && items.length === 0 ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(l) => l.uuid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchLeads(true)} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.subtitle}>Manage inquiries and update status to match the web portal.</Text>

              {stats ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statsRow}
                >
                  <MiniStat label="Total" value={String(stats.total ?? 0)} />
                  <MiniStat label="New" value={String(stats.new ?? 0)} accent="#ca8a04" />
                  <MiniStat label="In progress" value={String(stats.in_progress ?? 0)} accent="#7c3aed" />
                  <MiniStat label="Converted" value={String(stats.converted ?? 0)} accent="#047857" />
                  <MiniStat label="Conv. rate" value={String(stats.conversion_rate ?? '0%')} accent={colors.primary[600]} />
                </ScrollView>
              ) : null}

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, email, or message…"
                placeholderTextColor={colors.text.muted}
                style={styles.searchInput}
              />

              <View style={styles.filterRow}>
                <View style={styles.filterCell}>
                  <PicklistField
                    label="Status"
                    value={status}
                    options={STATUS_FILTERS}
                    onChange={setStatus}
                    placeholder="All statuses"
                    noMargin
                  />
                </View>
                <View style={styles.filterCell}>
                  <PicklistField
                    label="Urgency"
                    value={urgency}
                    options={URGENCY_FILTERS}
                    onChange={setUrgency}
                    placeholder="All urgency"
                    noMargin
                  />
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={{ color: colors.text.secondary, paddingBottom: spacing['2xl'] }}>No leads match your filters.</Text>
          }
          renderItem={({ item }) => {
            const st = leadStatusStyle(item.status);
            return (
              <Pressable
                onPress={() => navigation.navigate('LeadDetail', { uuid: item.uuid })}
                style={{
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                  <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, flex: 1 }}>
                    {fullName(item.user)}
                  </Text>
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
                      {leadStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {!!item.message && (
                  <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }} numberOfLines={2}>
                    {item.message}
                  </Text>
                )}
                <Text style={{ marginTop: spacing.sm, color: colors.text.muted, fontSize: typography.fontSize.sm }}>
                  {item.service_type} · {urgencyLabel(item.urgency)} urgency · {item.created_at ? formatTimeAgo(item.created_at) : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </AppScreen>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 96,
      }}
    >
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{label}</Text>
      <Text style={{ marginTop: 2, fontWeight: typography.fontWeight.bold, color: accent ?? colors.text.primary }}>{value}</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.lg,
    color: colors.danger,
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
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterCell: {
    flex: 1,
    minWidth: 0,
  },
});
