import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { AppScreen } from '../../components/AppScreen';
import { LibraryCover } from '../../components/library/LibraryCover';
import { GuestAuthPrompt } from '../../components/guest/GuestAuthPrompt';
import { GuestActiveFiltersRow } from '../../components/guest/GuestChipRow';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';
import type { GuestLibraryItem } from '../../api/guestApi';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { useGuestActions } from '../../context/GuestActionsContext';
import {
  EMPTY_GUEST_LIBRARY_FILTERS,
  GuestLibraryFilterModal,
  guestLibraryFiltersToQuery,
  hasActiveGuestLibraryFilters,
  type GuestLibraryFilters,
} from './GuestLibraryFilterModal';

const CARD_GAP = spacing.md;
const NUM_COLUMNS = 2;

function MetaTag({ label, tone }: { label: string; tone: 'category' | 'country' }) {
  const text = label.trim();
  if (!text) return null;

  return (
    <View style={[styles.metaTag, tone === 'category' ? styles.metaTagCategory : styles.metaTagCountry]}>
      <Text style={[styles.metaTagText, tone === 'category' ? styles.metaTagTextCategory : styles.metaTagTextCountry]}>
        {text}
      </Text>
    </View>
  );
}

function GuestLibraryCard({
  item,
  width,
  onPress,
}: {
  item: GuestLibraryItem;
  width: number;
  onPress: () => void;
}) {
  const cover = resolveMediaUrl(item.cover_image_url);
  const countries = (item.countries ?? []).map((c) => c.trim()).filter(Boolean);

  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      <LibraryCover uri={cover} width={width} height={width * 1.25} borderRadius={radii.lg} />
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.tagRow}>
          {item.category?.name ? <MetaTag label={item.category.name} tone="category" /> : null}
          {countries.length > 0 ? (
            countries.map((country) => <MetaTag key={country} label={country} tone="country" />)
          ) : (
            <MetaTag label="Worldwide" tone="country" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const PAGE_SIZE = 100;

export function GuestLibraryScreen() {
  const { goSignIn, goSignUp } = useGuestActions();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GuestLibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [regionOptions, setRegionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [filters, setFilters] = useState<GuestLibraryFilters>(EMPTY_GUEST_LIBRARY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<GuestLibraryFilters>(EMPTY_GUEST_LIBRARY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const loadingMoreRef = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.lg * 2 - CARD_GAP) / NUM_COLUMNS;

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const loadMeta = useCallback(async () => {
    const res = await guestApi.getGuestMeta();
    if (!res.success) return;
    setCategoryOptions(
      (res.data.library_categories ?? []).map((category) => ({
        value: category.slug,
        label: category.name,
      })),
    );
    setRegionOptions(res.data.library_regions ?? []);
  }, []);

  const load = useCallback(
    async (options: { page?: number; append?: boolean; refresh?: boolean } = {}) => {
      const nextPage = options.page ?? 1;
      const append = Boolean(options.append);
      const isRefresh = Boolean(options.refresh);

      if (append) {
        if (loadingMoreRef.current || nextPage > lastPage) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await guestApi.browseGuestLibrary({
        per_page: PAGE_SIZE,
        page: nextPage,
        search: search || undefined,
        ...guestLibraryFiltersToQuery(filters),
      });

      if (append) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }

      if (!res.success) {
        if (!append) setError(res.message);
        return;
      }

      const nextItems = res.data.items.data ?? [];
      const meta = res.data.items.meta;
      setPage(meta?.current_page ?? nextPage);
      setLastPage(meta?.last_page ?? 1);
      setTotal(meta?.total ?? nextItems.length);
      setItems((prev) => {
        if (!append) return nextItems;
        const seen = new Set(prev.map((item) => item.slug));
        return [...prev, ...nextItems.filter((item) => !seen.has(item.slug))];
      });

      if (categoryOptions.length === 0 && res.data.categories?.length) {
        setCategoryOptions(
          res.data.categories.map((category) => ({
            value: category.slug,
            label: category.name,
          })),
        );
      }
      if (regionOptions.length === 0 && res.data.regions?.length) {
        setRegionOptions(res.data.regions);
      }
    },
    [categoryOptions.length, filters, lastPage, regionOptions.length, search],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMeta();
    }, [loadMeta]),
  );

  useEffect(() => {
    void load({ page: 1, append: false });
  }, [filters, search]);

  const filtersActive = hasActiveGuestLibraryFilters(filters);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.category) {
      const match = categoryOptions.find((option) => option.value === filters.category);
      labels.push(match?.label ?? filters.category);
    }
    if (filters.region) {
      const match = regionOptions.find((option) => option.value === filters.region);
      labels.push(match?.label ?? filters.region);
    }
    return labels;
  }, [categoryOptions, filters, regionOptions]);

  function openFilterModal() {
    setDraftFilters(filters);
    setFilterOpen(true);
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Browse eBooks</Text>
        <Text style={styles.heroSubtitle}>
          Preview titles from our library. Filter by category or region, or search by title.
        </Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              value={searchDraft}
              onChangeText={setSearchDraft}
              returnKeyType="search"
              placeholder="Search by title..."
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
            />
            {searchDraft.length > 0 ? (
              <Pressable onPress={() => setSearchDraft('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={openFilterModal}
            style={[styles.filterButton, filtersActive && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Open eBook filters"
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
          setFilters(EMPTY_GUEST_LIBRARY_FILTERS);
          setSearchDraft('');
        }}
      />

      <Text style={styles.resultsText}>
        {loading ? 'Loading…' : `${total} title${total === 1 ? '' : 's'}`}
      </Text>
    </View>
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <FlatList
        data={items}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.slug}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load({ page: 1, refresh: true })} />}
        removeClippedSubviews={false}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (page < lastPage && !loadingMoreRef.current) void load({ page: page + 1, append: true });
        }}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary[600]} />
          ) : page < lastPage ? (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() => {
                if (!loadingMoreRef.current) void load({ page: page + 1, append: true });
              }}
            >
              <Text style={styles.loadMoreText}>Load more books</Text>
            </Pressable>
          ) : total > 0 ? (
            <Text style={styles.loadMoreHint}>All {total} titles loaded</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <GuestLibraryCard item={item} width={cardWidth} onPress={() => setAuthPromptOpen(true)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>No books match your search or filters.</Text>
          )
        }
      />

      <GuestLibraryFilterModal
        visible={filterOpen}
        draft={draftFilters}
        categoryOptions={categoryOptions}
        regionOptions={regionOptions}
        onChange={setDraftFilters}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters(draftFilters);
          setFilterOpen(false);
        }}
        onClear={() => setDraftFilters(EMPTY_GUEST_LIBRARY_FILTERS)}
      />

      <GuestAuthPrompt
        visible={authPromptOpen}
        title="Sign in to view this book"
        message="Create a free account or sign in to read details, purchase titles, and access your library."
        onClose={() => setAuthPromptOpen(false)}
        onSignIn={() => {
          setAuthPromptOpen(false);
          goSignIn();
        }}
        onSignUp={() => {
          setAuthPromptOpen(false);
          goSignUp();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerBlock: {
    paddingBottom: spacing.md,
  },
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
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: spacing.lg,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  columnWrapper: { gap: CARD_GAP },
  rowGap: { height: CARD_GAP },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50] ?? '#EFF6FF',
  },
  loadMoreText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  loadMoreHint: {
    textAlign: 'center',
    marginVertical: spacing.lg,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  cardBody: { padding: spacing.sm },
  title: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaTag: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
  },
  metaTagCategory: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
  },
  metaTagCountry: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  metaTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  metaTagTextCategory: {
    color: colors.primary[800],
  },
  metaTagTextCountry: {
    color: '#166534',
  },
});
