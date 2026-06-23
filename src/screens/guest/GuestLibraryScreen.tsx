import React, { useCallback, useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { LibraryCover } from '../../components/library/LibraryCover';
import { GuestAuthPrompt } from '../../components/guest/GuestAuthPrompt';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';
import type { GuestLibraryItem } from '../../api/guestApi';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { useGuestActions } from '../../context/GuestActionsContext';

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

export function GuestLibraryScreen() {
  const { goSignIn, goSignUp } = useGuestActions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GuestLibraryItem[]>([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.lg * 2 - CARD_GAP) / NUM_COLUMNS;

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await guestApi.browseGuestLibrary({
        per_page: 24,
        search: search || undefined,
      });
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.items.data ?? []);
    },
    [search],
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Browse eBooks</Text>
        <Text style={styles.heroSubtitle}>
          Preview titles from our library. Sign in to read, purchase, or save favorites.
        </Text>
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
      </View>

      <Text style={styles.resultsText}>
        {loading ? 'Loading…' : `${items.length} title${items.length === 1 ? '' : 's'}`}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
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
            <Text style={styles.emptyText}>No books match your search.</Text>
          )
        }
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  resultsText: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
