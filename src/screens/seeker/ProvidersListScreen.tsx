import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providersApi from '../../api/providersApi';
import * as authApi from '../../api/authApi';
import * as onboardingApi from '../../api/onboardingApi';
import type { ProviderListItem } from '../../types/provider';
import type { ProvidersStackParamList } from './ProvidersStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import {
  EMPTY_PROVIDER_FILTERS,
  hasActiveProviderFilters,
  providerFiltersToQuery,
  ProvidersFilterModal,
  type ProviderFilters,
} from './ProvidersFilterModal';

type ProvidersListRoute = RouteProp<ProvidersStackParamList, 'ProvidersList'>;

const AVATAR_SIZE = 52;

function providerTitle(item: ProviderListItem) {
  return item.business_name || `${item.user?.first_name ?? ''} ${item.user?.last_name ?? ''}`.trim() || 'Provider';
}

function providerInitials(item: ProviderListItem) {
  const title = providerTitle(item);
  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? 'P').toUpperCase();
}

function ProviderRow({
  item,
  onPress,
  onToggleFavorite,
  favoriteLoading,
}: {
  item: ProviderListItem;
  onPress: () => void;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
}) {
  const title = providerTitle(item);
  const primaryService = item.service_types?.[0]?.trim();
  const heartName = item.is_favorited ? 'heart' : 'heart-outline';
  const avatarUrl = resolveMediaUrl(item.user?.avatar_url);

  return (
    <Pressable onPress={onPress} style={styles.providerCard}>
      <View style={styles.providerHeader}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{providerInitials(item)}</Text>
          </View>
        )}
        <View style={styles.providerMain}>
          <View style={styles.providerTitleRow}>
            <Text style={styles.providerTitle} numberOfLines={2}>
              {title}
            </Text>
            {onToggleFavorite ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onToggleFavorite();
                }}
                disabled={favoriteLoading}
                style={styles.favoriteButton}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                ) : (
                  <Ionicons name={heartName} size={18} color={item.is_favorited ? '#e11d48' : colors.text.muted} />
                )}
              </Pressable>
            ) : null}
          </View>
          {!!item.tagline && (
            <Text style={styles.providerTagline} numberOfLines={2}>
              {item.tagline}
            </Text>
          )}
          <View style={styles.metaWrap}>
            {!!primaryService && (
              <View style={styles.serviceChip}>
                <Text style={styles.serviceChipText} numberOfLines={1}>
                  {primaryService}
                </Text>
              </View>
            )}
            {!!item.location_display && (
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location_display}
              </Text>
            )}
            <Text style={styles.metaText}>
              {item.average_rating ? `${Number(item.average_rating).toFixed(1)}★` : 'No rating'} · {item.total_reviews ?? 0}{' '}
              reviews
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function ProvidersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProvidersStackParamList>>();
  const route = useRoute<ProvidersListRoute>();
  const { role } = useAuth();
  const canFavorite = role === 'user';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProviderListItem[]>([]);
  const [query, setQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(route.params?.favoritesOnly === true);
  const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProviderFilters>(EMPTY_PROVIDER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (typeof route.params?.favoritesOnly === 'boolean') {
      setShowFavoritesOnly(route.params.favoritesOnly);
    }
  }, [route.params?.favoritesOnly]);

  useEffect(() => {
    navigation.setOptions({ title: showFavoritesOnly ? 'Saved' : 'Find Provider' });
  }, [navigation, showFavoritesOnly]);

  useEffect(() => {
    void (async () => {
      const [metaRes, onboardingRes] = await Promise.all([authApi.registerMeta(), onboardingApi.meta()]);
      if (metaRes.success) {
        setServiceTypeOptions(metaRes.data.service_types_provider ?? []);
      }
      if (onboardingRes.success) {
        setLanguageOptions(onboardingRes.data.languageOptions ?? []);
      }
    })();
  }, []);

  const load = useCallback(
    async (isRefresh = false, activeFilters: ProviderFilters = filters) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await providersApi.listProviders({
        per_page: 20,
        favorites: showFavoritesOnly || undefined,
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
    [showFavoritesOnly, filters]
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const title = providerTitle(item);
      const location = item.location_display || '';
      const tagline = item.tagline || '';
      const services = (item.service_types ?? []).join(' ');
      return [title, location, tagline, services].some((part) => part.toLowerCase().includes(q));
    });
  }, [items, query]);

  const filtersActive = hasActiveProviderFilters(filters);

  const openFilters = useCallback(() => {
    setDraftFilters(filters);
    setFilterOpen(true);
  }, [filters]);

  const toggleFavorite = useCallback(
    async (item: ProviderListItem) => {
      if (!canFavorite || favoriteSlug) return;
      const previousFavorite = !!item.is_favorited;
      const optimisticFavorite = !previousFavorite;
      setFavoriteSlug(item.slug);
      setError(null);
      setItems((current) =>
        current.map((row) => (row.slug === item.slug ? { ...row, is_favorited: optimisticFavorite } : row))
      );

      const res = await providersApi.toggleFavorite(item.slug);
      setFavoriteSlug(null);

      if (!res.success) {
        setItems((current) =>
          current.map((row) => (row.slug === item.slug ? { ...row, is_favorited: previousFavorite } : row))
        );
        setError(res.message);
        return;
      }

      const serverFavorite = !!res.data.favorited;
      setItems((current) => {
        const next = current.map((row) => (row.slug === item.slug ? { ...row, is_favorited: serverFavorite } : row));
        if (showFavoritesOnly && !serverFavorite) {
          return next.filter((row) => row.slug !== item.slug);
        }
        return next;
      });
    },
    [canFavorite, favoriteSlug, showFavoritesOnly]
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{showFavoritesOnly ? 'Saved providers' : 'Find trusted providers'}</Text>
        {canFavorite ? (
          <View style={styles.filterRow}>
            <FilterChip label="All providers" active={!showFavoritesOnly} onPress={() => setShowFavoritesOnly(false)} />
            <FilterChip label="Saved" active={showFavoritesOnly} onPress={() => setShowFavoritesOnly(true)} />
          </View>
        ) : null}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={showFavoritesOnly ? 'Search saved providers...' : 'Search provider name...'}
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            onPress={openFilters}
            style={[styles.filterButton, filtersActive && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Open provider filters"
          >
            <Ionicons
              name="filter-outline"
              size={18}
              color={filtersActive ? colors.primary[600] : colors.text.muted}
            />
            {filtersActive ? <View style={styles.filterIndicator} /> : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
        </Text>
        {showFavoritesOnly ? <Text style={styles.resultsTag}>Saved only</Text> : null}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredItems}
          keyExtractor={(p) => p.slug}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => (
            <ProviderRow
              item={item}
              onPress={() => navigation.navigate('ProviderDetail', { slug: item.slug })}
              onToggleFavorite={canFavorite ? () => void toggleFavorite(item) : undefined}
              favoriteLoading={favoriteSlug === item.slug}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.trim()
                ? 'No providers match your search.'
                : showFavoritesOnly
                  ? 'No saved providers yet.'
                  : filtersActive
                    ? 'No providers match your filters.'
                    : 'No providers found.'}
            </Text>
          }
          contentContainerStyle={styles.listContent}
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
        onClear={() => setDraftFilters(EMPTY_PROVIDER_FILTERS)}
      />
    </AppScreen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#cfe0ff',
    backgroundColor: '#edf4ff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  filterRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: '#ffffffcc',
  },
  filterChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  searchRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d9e2ef',
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 0,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e2ef',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: '#eff6ff',
  },
  filterIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  resultsRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  resultsTag: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.xs,
  },
  loadingWrap: {
    marginTop: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  providerCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#dde4ef',
    borderRadius: 18,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.lg,
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  providerMain: {
    flex: 1,
    minWidth: 0,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  providerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffd9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  providerTagline: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  serviceChip: {
    borderRadius: radii.full,
    backgroundColor: '#dbeafe',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  serviceChipText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  metaText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    maxWidth: '100%',
  },
  emptyText: {
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
