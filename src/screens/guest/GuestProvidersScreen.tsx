import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { GuestAuthPrompt } from '../../components/guest/GuestAuthPrompt';
import { GuestActiveFiltersRow } from '../../components/guest/GuestChipRow';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';
import type { GuestProviderItem } from '../../api/guestApi';
import { useGuestActions } from '../../context/GuestActionsContext';
import type { GuestTabParamList } from '../../navigation/GuestNavigator';
import {
  EMPTY_PROVIDER_FILTERS,
  ProvidersFilterModal,
  hasActiveProviderFilters,
  providerFiltersToQuery,
  type ProviderFilters,
} from '../seeker/ProvidersFilterModal';

function providerInitials(item: GuestProviderItem) {
  const label = item.business_type || 'P';
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? 'P').toUpperCase();
}

function ProviderCard({ item, onPress }: { item: GuestProviderItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.providerCard}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>{providerInitials(item)}</Text>
      </View>
      <View style={styles.providerBody}>
        <Text style={styles.businessType} numberOfLines={2}>
          {item.business_type}
        </Text>
        <Text style={styles.location} numberOfLines={2}>
          {item.location}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
    </Pressable>
  );
}

export function GuestProvidersScreen() {
  const { goSignIn, goSignUp } = useGuestActions();
  const route = useRoute<RouteProp<GuestTabParamList, 'GuestProviders'>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GuestProviderItem[]>([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [authPrompt, setAuthPrompt] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    const preset = route.params?.service_type?.trim();
    if (!preset) return;
    setFilters((current) => {
      if (current.service_types.length === 1 && current.service_types[0] === preset) {
        return current;
      }
      return { ...EMPTY_PROVIDER_FILTERS, service_types: [preset] };
    });
  }, [route.params?.service_type]);

  const loadMeta = useCallback(async () => {
    const res = await guestApi.getGuestMeta();
    if (res.success) {
      setServiceTypeOptions(res.data.service_types ?? []);
      setLanguageOptions(res.data.language_options ?? []);
    }
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await guestApi.listGuestProviders({
        per_page: 20,
        search: search || undefined,
        ...providerFiltersToQuery(filters),
      });
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.providers.data ?? []);
    },
    [filters, search],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMeta();
    }, [loadMeta]),
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const filtersActive = hasActiveProviderFilters(filters);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    filters.service_types.forEach((value) => {
      const match = serviceTypeOptions.find((option) => option.value === value);
      labels.push(match?.label ?? value);
    });
    filters.languages.forEach((value) => {
      const match = languageOptions.find((option) => option.value === value);
      labels.push(match?.label ?? value);
    });
    if (filters.location.trim()) {
      labels.push(filters.location.trim());
    }
    if (filters.remote_only) labels.push('Remote only');
    if (filters.free_consultation) labels.push('Free consult');
    return labels;
  }, [filters, languageOptions, serviceTypeOptions]);

  function openFilterModal() {
    setDraftFilters(filters);
    setFilterOpen(true);
  }

  function openAuthPrompt() {
    setAuthPrompt({
      title: 'Sign in to view service provider details',
      message:
        'Create a free account or sign in to view full service provider profiles, contact service providers, and request a match.',
    });
  }

  const listHeader = (
    <View>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Browse service providers</Text>
        <Text style={styles.heroSubtitle}>
          Preview trusted immigration professionals. Search by city, ZIP, language, or service type.
        </Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              value={searchDraft}
              onChangeText={setSearchDraft}
              placeholder="Search by name, city, ZIP..."
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchDraft.length > 0 ? (
              <Pressable
                onPress={() => {
                  setSearchDraft('');
                  setSearch('');
                }}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={openFilterModal}
            style={[styles.filterButton, filtersActive && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Open provider filters"
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filtersActive ? colors.primary[600] : colors.text.muted}
            />
            {filtersActive ? <View style={styles.filterIndicator} /> : null}
          </Pressable>
        </View>
      </View>

      <GuestActiveFiltersRow
        labels={activeFilterLabels}
        onClear={() => {
          setFilters(EMPTY_PROVIDER_FILTERS);
          setSearchDraft('');
          setSearch('');
        }}
      />

      <Text style={styles.resultsText}>
        {loading ? 'Loading…' : `${items.length} service provider${items.length === 1 ? '' : 's'}`}
      </Text>
    </View>
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        renderItem={({ item }) => <ProviderCard item={item} onPress={openAuthPrompt} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>No service providers match your search or filters.</Text>
          )
        }
      />

      <ProvidersFilterModal
        visible={filterOpen}
        draft={draftFilters}
        serviceTypeOptions={serviceTypeOptions}
        languageOptions={languageOptions}
        onChange={setDraftFilters}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters(draftFilters);
          setFilterOpen(false);
        }}
        onClear={() => setDraftFilters(EMPTY_PROVIDER_FILTERS)}
        useServiceProviderLabel
      />

      <GuestAuthPrompt
        visible={!!authPrompt}
        title={authPrompt?.title ?? ''}
        message={authPrompt?.message ?? ''}
        onClose={() => setAuthPrompt(null)}
        onSignIn={() => {
          setAuthPrompt(null);
          goSignIn();
        }}
        onSignUp={() => {
          setAuthPrompt(null);
          goSignUp();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  resultsText: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  loadingWrap: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  errorText: { margin: spacing.lg, color: colors.danger, textAlign: 'center' },
  listContent: { paddingBottom: spacing['3xl'], gap: spacing.md },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  providerBody: { flex: 1 },
  businessType: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  location: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: spacing.lg,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
});
