import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import * as libraryApi from '../../api/libraryApi';
import { restoreApplePurchasesOnDevice } from '../../services/appleIapService';
import { shouldUseAppleIap } from '../../utils/platformPayments';
import type { LibraryStackParamList } from './LibraryStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const CARD_GAP = spacing.md;
const NUM_COLUMNS = 2;

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

export function LibraryMyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const { role } = useAuth();
  const isProvider = role === 'provider';
  const [tab, setTab] = useState<'purchased' | 'available'>('available');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.xl * 2 - CARD_GAP) / NUM_COLUMNS;

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.getMyLibrary(tab, 1);
    setLoading(false);
    if (!res.success) return;
    const raw = res.data?.section === tab ? res.data?.items : res.data?.items;
    const coll = raw?.data ?? [];
    setItems(coll);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [tab]),
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
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const title = String(item?.title ?? '').toLowerCase();
      const searchMatch = q === '' || title.includes(q);
      return searchMatch && matchesFilter(item, filter);
    });
  }, [items, query, filter]);

  const activeFilterLabel = useMemo(
    () => filterOptions.find((option) => option.key === filter)?.label ?? 'All',
    [filterOptions, filter],
  );

  const emptyMessage =
    query.trim() !== '' || filter !== 'all'
      ? 'No titles match your search or filter.'
      : tab === 'purchased'
        ? 'No purchased titles yet.'
        : 'No titles available right now.';

  return (
    <AppScreen style={{ paddingHorizontal: isProvider ? spacing.lg : spacing.xl, paddingBottom: spacing.xl }}>
      <View style={s.tabRow}>
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
      {shouldUseAppleIap() ? (
        <Pressable
          onPress={() => {
            void (async () => {
              setRestoring(true);
              try {
                const result = await restoreApplePurchasesOnDevice();
                await load();
                const detail =
                  result.errors.length > 0
                    ? `\n\nSome items could not be restored:\n${result.errors.slice(0, 3).join('\n')}`
                    : '';
                Alert.alert(
                  'Restore purchases',
                  `Restored ${result.library_restored} library title(s).${
                    result.ai_assistant_active ? ' AI Assistant is active.' : ''
                  }${result.provider_subscription_active ? ' Provider subscription is active.' : ''}${
                    result.videos_restored > 0 ? ` ${result.videos_restored} video(s) restored.` : ''
                  }${detail}`,
                );
              } catch (e) {
                Alert.alert(
                  'Restore purchases',
                  e instanceof Error ? e.message : 'Could not restore purchases.',
                );
              } finally {
                setRestoring(false);
              }
            })();
          }}
          disabled={restoring}
          style={s.restoreRow}
        >
          <Text style={s.restoreText}>{restoring ? 'Restoring…' : 'Restore App Store purchases'}</Text>
        </Pressable>
      ) : null}
      <View style={s.searchWrap}>
        <View style={s.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by book name"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            style={s.searchInput}
          />
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
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : visibleItems.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={visibleItems}
          numColumns={isProvider ? 1 : NUM_COLUMNS}
          key={isProvider ? 'list' : 'grid'}
          columnWrapperStyle={isProvider ? undefined : { gap: CARD_GAP }}
          contentContainerStyle={isProvider ? s.listContent : undefined}
          keyExtractor={(it) => String(it.slug ?? it.id)}
          renderItem={({ item }) => {
            const cover = resolveMediaUrl(item.cover_image_url);
            return (
              <LibraryBookCard
                item={item}
                coverUri={cover}
                variant={isProvider ? 'compact' : 'grid'}
                width={isProvider ? undefined : cardWidth}
                owned={tab === 'purchased'}
                onPress={() => item.slug && navigation.navigate('LibraryDetail', { slug: item.slug })}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: isProvider ? spacing.sm : CARD_GAP }} />}
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
  listContent: {
    gap: spacing.sm,
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
  restoreRow: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  restoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
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
