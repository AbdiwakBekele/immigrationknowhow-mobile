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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppScreen } from '../../components/AppScreen';
import { GuestAuthPrompt } from '../../components/guest/GuestAuthPrompt';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';
import type { GuestProviderItem } from '../../api/guestApi';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import {
  EMPTY_PROVIDER_FILTERS,
  hasActiveProviderFilters,
  providerFiltersToQuery,
  ProvidersFilterModal,
  type ProviderFilters,
} from '../seeker/ProvidersFilterModal';
import { useGuestActions } from '../../context/GuestActionsContext';

function providerInitials(item: GuestProviderItem) {
  const label = item.business_type || 'P';
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? 'P').toUpperCase();
}

function ProviderCard({ item, onPress }: { item: GuestProviderItem; onPress: () => void }) {
  const avatarUrl = resolveMediaUrl(item.avatar_url);

  return (
    <Pressable onPress={onPress} style={styles.providerCard}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{providerInitials(item)}</Text>
        </View>
      )}
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GuestProviderItem[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [authPrompt, setAuthPrompt] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await guestApi.getGuestMeta();
      if (res.success) {
        setServiceTypeOptions(res.data.service_types ?? []);
        setLanguageOptions(res.data.language_options ?? []);
      }
    })();
  }, []);

  const load = useCallback(
    async (isRefresh = false, activeFilters: ProviderFilters = filters) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await guestApi.listGuestProviders({
        per_page: 20,
        ...providerFiltersToQuery(activeFilters),
      });
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.providers.data ?? []);
    },
    [filters],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return [item.business_type, item.location].some((part) => part.toLowerCase().includes(q));
    });
  }, [items, query]);

  const filtersActive = hasActiveProviderFilters(filters);

  function openAuthPrompt(kind: 'provider') {
    setAuthPrompt({
      title: kind === 'provider' ? 'Sign in to view provider details' : 'Sign in required',
      message: 'Create a free account or sign in to view full provider profiles, contact providers, and request a match.',
    });
  }

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Browse providers</Text>
        <Text style={styles.heroSubtitle}>Preview trusted immigration professionals. Sign in to contact or save favorites.</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, city, ZIP..."
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            onPress={() => {
              setDraftFilters(filters);
              setFilterOpen(true);
            }}
            style={[styles.filterButton, filtersActive && styles.filterButtonActive]}
          >
            <Ionicons name="filter-outline" size={18} color={filtersActive ? colors.primary[600] : colors.text.muted} />
            {filtersActive ? <View style={styles.filterIndicator} /> : null}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => (
            <ProviderCard item={item} onPress={() => openAuthPrompt('provider')} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No providers match your search.</Text>}
        />
      )}

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
          void load(false, draftFilters);
        }}
        onClear={() => {
          setDraftFilters(EMPTY_PROVIDER_FILTERS);
          setFilters(EMPTY_PROVIDER_FILTERS);
          setFilterOpen(false);
          void load(false, EMPTY_PROVIDER_FILTERS);
        }}
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
    marginBottom: spacing.md,
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
    borderColor: colors.primary[200],
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { margin: spacing.lg, color: colors.danger, textAlign: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
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
    marginTop: spacing['2xl'],
  },
});
