import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import {
  LibraryBookCard,
  libraryItemHasAudio,
  libraryItemHasPdf,
} from '../../components/library/LibraryBookCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import * as libraryApi from '../../api/libraryApi';
import * as ebookShareApi from '../../api/ebookShareApi';
import { EbookShareCampaignBanner } from '../../components/library/EbookShareCampaignBanner';
import type { LibraryStackParamList } from './LibraryStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const CARD_GAP = spacing.md;
const NUM_COLUMNS = 2;
const PAGE_SIZE = 100;

type LibraryTab = 'all' | 'purchased' | 'available';
type LibraryFilter = 'all' | 'ebook' | 'audio' | `category:${string}`;

function matchesFilter(item: any, filter: LibraryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'ebook') return libraryItemHasPdf(item);
  if (filter === 'audio') return libraryItemHasAudio(item);
  if (filter.startsWith('category:')) {
    const wanted = filter.slice('category:'.length).trim().toLowerCase();
    return String(item?.category?.name ?? '').trim().toLowerCase() === wanted;
  }
  return true;
}

function extractMyPage(payload: any) {
  const raw = payload?.items;
  const items = Array.isArray(raw?.data) ? raw.data : [];
  return {
    items,
    page: Number(raw?.current_page ?? 1),
    lastPage: Number(raw?.last_page ?? 1),
    total: Number(raw?.total ?? items.length),
  };
}

function extractBrowsePage(payload: any) {
  const bucket = payload?.items;
  const items = Array.isArray(bucket?.data) ? bucket.data : [];
  const meta = bucket?.meta ?? {};
  return {
    items,
    page: Number(meta.current_page ?? 1),
    lastPage: Number(meta.last_page ?? 1),
    total: Number(meta.total ?? items.length),
  };
}

export function LibraryMyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [tab, setTab] = useState<LibraryTab>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [shareCampaign, setShareCampaign] = useState<any>(null);
  const loadingMoreRef = useRef(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.xl * 2 - CARD_GAP) / NUM_COLUMNS;

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(async (nextPage = 1, append = false) => {
    if (append) {
      if (loadingMoreRef.current || nextPage > lastPage) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const res =
      tab === 'all'
        ? await libraryApi.browseLibrary({
            per_page: PAGE_SIZE,
            page: nextPage,
            ...(search ? { search } : {}),
          })
        : await libraryApi.getMyLibrary(tab, nextPage, PAGE_SIZE, search || undefined);

    if (append) {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    } else {
      setLoading(false);
    }

    if (!res.success) return;

    const parsed = tab === 'all' ? extractBrowsePage(res.data) : extractMyPage(res.data);
    setPage(parsed.page);
    setLastPage(parsed.lastPage);
    setTotal(parsed.total);
    setItems((prev) => {
      if (!append) return parsed.items;
      const seen = new Set(prev.map((item) => String(item.slug ?? item.id)));
      return [...prev, ...parsed.items.filter((item) => !seen.has(String(item.slug ?? item.id)))];
    });
  }, [lastPage, search, tab]);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setLastPage(1);
      setTotal(0);
      void load(1, false);
      void ebookShareApi.getShareCampaign().then((res) => {
        if (res.success) setShareCampaign(res.data);
      });
      // Reload when tab or server search term changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, search]),
  );

  const filterOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        items
          .map((item) => String(item?.category?.name ?? '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { key: 'all' as const, label: 'All' },
      { key: 'ebook' as const, label: 'EBook' },
      { key: 'audio' as const, label: 'Audio' },
      ...categories.map((category) => ({
        key: `category:${category}` as const,
        label: category,
      })),
    ];
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => matchesFilter(item, filter));
  }, [items, filter]);

  const activeFilterLabel = useMemo(
    () => filterOptions.find((option) => option.key === filter)?.label ?? 'All',
    [filterOptions, filter],
  );

  const emptyMessage =
    search !== '' || filter !== 'all'
      ? 'No titles match your search or filter.'
      : tab === 'purchased'
        ? 'No purchased titles yet.'
        : tab === 'available'
          ? 'No unpurchased titles right now.'
          : 'No titles available right now.';

  const listHeader = (
    <>
      {(shareCampaign?.eligible && (shareCampaign?.can_start || (shareCampaign?.rewarded && shareCampaign?.coupon_code))) ? (
        <EbookShareCampaignBanner
          campaign={shareCampaign}
          onPress={() => navigation.navigate('EbookShareCampaign')}
        />
      ) : null}
      <View style={s.tabRow}>
        <Pressable
          onPress={() => {
            setTab('all');
            setFilter('all');
          }}
          style={[s.tab, tab === 'all' && s.tabActive]}
        >
          <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>All books</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setTab('available');
            setFilter('all');
          }}
          style={[s.tab, tab === 'available' && s.tabActive]}
        >
          <Text style={[s.tabText, tab === 'available' && s.tabTextActive]}>Available</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setTab('purchased');
            setFilter('all');
          }}
          style={[s.tab, tab === 'purchased' && s.tabActive]}
        >
          <Text style={[s.tabText, tab === 'purchased' && s.tabTextActive]}>Purchased</Text>
        </Pressable>
      </View>
      <View style={s.searchWrap}>
        <View style={s.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            value={searchDraft}
            onChangeText={setSearchDraft}
            placeholder="Search by book name"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => setSearch(searchDraft.trim())}
            style={s.searchInput}
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
          onPress={() => setFilterOpen(true)}
          style={[s.filterButton, filter !== 'all' && s.filterButtonActive]}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={filter !== 'all' ? colors.primary[600] : colors.text.muted}
          />
          {filter !== 'all' ? <View style={s.filterIndicator} /> : null}
        </Pressable>
      </View>
      {filter !== 'all' ? <Text style={s.filterSummary}>Showing: {activeFilterLabel}</Text> : null}
      {!loading && total > 0 ? (
        <Text style={s.countText}>
          Showing {visibleItems.length} of {total} title{total === 1 ? '' : 's'}
        </Text>
      ) : null}
    </>
  );

  return (
    <AppScreen style={{ flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
      {loading ? (
        <>
          {listHeader}
          <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
        </>
      ) : visibleItems.length === 0 ? (
        <>
          {listHeader}
          <View style={s.empty}>
            <Text style={s.emptyText}>{emptyMessage}</Text>
          </View>
        </>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visibleItems}
          numColumns={NUM_COLUMNS}
          key="library-grid"
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          keyExtractor={(it) => String(it.slug ?? it.id)}
          ListHeaderComponent={listHeader}
          // Same catalog on iOS + Android; avoid clipped rows that skip onEndReached on Android grids.
          removeClippedSubviews={false}
          onEndReachedThreshold={0.2}
          onEndReached={() => {
            if (page < lastPage && !loadingMoreRef.current) void load(page + 1, true);
          }}
          ListFooterComponent={
            <View style={s.footer}>
              {loadingMore ? (
                <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary[600]} />
              ) : page < lastPage ? (
                <Pressable
                  style={s.loadMoreButton}
                  onPress={() => {
                    if (!loadingMoreRef.current) void load(page + 1, true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Load more books"
                >
                  <Text style={s.loadMoreText}>Load more books</Text>
                </Pressable>
              ) : total > 0 ? (
                <Text style={s.loadMoreHint}>All {total} titles loaded</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const cover = resolveMediaUrl(item.cover_image_url);
            return (
              <LibraryBookCard
                item={item}
                coverUri={cover}
                variant="grid"
                width={cardWidth}
                owned={tab === 'purchased' || Boolean(item.has_access)}
                onPress={() => item.slug && navigation.navigate('LibraryDetail', { slug: item.slug })}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        />
      )}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filter library</Text>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </Pressable>
            </View>
            {filterOptions.map((option) => {
              const active = filter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setFilter(option.key);
                    setFilterOpen(false);
                  }}
                  style={[s.modalOption, active && s.modalOptionActive]}
                >
                  <Text style={[s.modalOptionText, active && s.modalOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.primary[600]} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  tabTextActive: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  searchWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50] ?? '#EFF6FF',
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
  filterSummary: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  loadMoreButton: {
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
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  modalOptionActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50] ?? '#EFF6FF',
  },
  modalOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  modalOptionTextActive: {
    color: colors.primary[700] ?? colors.primary[600],
  },
  empty: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
