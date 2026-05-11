import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providersApi from '../../api/providersApi';
import type { ProviderListItem } from '../../types/provider';
import type { ProvidersStackParamList } from './ProvidersStack';

type ProvidersListRoute = RouteProp<ProvidersStackParamList, 'ProvidersList'>;

function providerTitle(item: ProviderListItem) {
  return item.business_name || `${item.user?.first_name ?? ''} ${item.user?.last_name ?? ''}`.trim() || 'Provider';
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

  return (
    <Pressable
      onPress={onPress}
      style={styles.providerCard}
    >
      <View style={styles.providerHeader}>
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
          {item.average_rating ? `${Number(item.average_rating).toFixed(1)}★` : 'No rating'} · {item.total_reviews ?? 0} reviews
        </Text>
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

  useEffect(() => {
    if (typeof route.params?.favoritesOnly === 'boolean') {
      setShowFavoritesOnly(route.params.favoritesOnly);
    }
  }, [route.params?.favoritesOnly]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await providersApi.listProviders({
        per_page: 20,
        favorites: showFavoritesOnly || undefined,
      });
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.providers.data ?? []);
    },
    [showFavoritesOnly]
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
    <AppScreen variant="gradient" style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>
          PROVIDERS
        </Text>
        <Text style={styles.heroTitle}>
          {showFavoritesOnly ? 'Saved providers' : 'Find trusted providers'}
        </Text>
        <Text style={styles.heroBody}>
          {showFavoritesOnly
            ? 'Keep your shortlist close and revisit the providers you want to contact.'
            : 'Browse by fit, location, and reviews to find the right support.'}
        </Text>
        {canFavorite ? (
          <View style={styles.filterRow}>
            <FilterChip label="All providers" active={!showFavoritesOnly} onPress={() => setShowFavoritesOnly(false)} />
            <FilterChip label="Saved" active={showFavoritesOnly} onPress={() => setShowFavoritesOnly(true)} />
          </View>
        ) : null}
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
      </View>

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
        </Text>
        {showFavoritesOnly ? (
          <Text style={styles.resultsTag}>Saved only</Text>
        ) : null}
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
                  : 'No providers found.'}
            </Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingTop: spacing.xl,
  },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#cfe0ff',
    backgroundColor: '#edf4ff',
    padding: spacing.lg,
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  filterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  searchWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d9e2ef',
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.md,
    color: colors.text.primary,
  },
  resultsRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsText: {
    color: colors.text.secondary,
  },
  resultsTag: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.xs,
  },
  loadingWrap: {
    marginTop: spacing['3xl'],
  },
  errorText: {
    marginTop: spacing.lg,
    color: colors.danger,
  },
  list: {
    marginTop: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  providerCard: {
    padding: spacing.lg,
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
  providerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffd9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  providerTagline: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
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

