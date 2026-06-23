import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function GuestLibraryScreen() {
  const { goSignIn, goSignUp } = useGuestActions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GuestLibraryItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [regions, setRegions] = useState<Array<{ value: string; label: string }>>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.lg * 2 - CARD_GAP) / NUM_COLUMNS;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await guestApi.browseGuestLibrary({
      per_page: 24,
      search: search.trim() || undefined,
      category: category || undefined,
      region: region || undefined,
    });
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setItems(res.data.items.data ?? []);
    setCategories(res.data.categories ?? []);
    setRegions(res.data.regions ?? []);
  }, [search, category, region]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    void load(false);
  }, [category, region]);

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Browse eBooks</Text>
        <Text style={styles.heroSubtitle}>Preview titles by category and country. Sign in to read, purchase, or save favorites.</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void load()}
            returnKeyType="search"
            placeholder="Search titles..."
            placeholderTextColor={colors.text.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="All categories" active={!category} onPress={() => setCategory(null)} />
          {categories.map((cat) => (
            <FilterChip
              key={cat.slug}
              label={cat.name}
              active={category === cat.slug}
              onPress={() => setCategory(cat.slug)}
            />
          ))}
        </ScrollView>
      ) : null}

      {regions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="All countries" active={!region} onPress={() => setRegion(null)} />
          {regions.map((r) => (
            <FilterChip key={r.value} label={r.label} active={region === r.value} onPress={() => setRegion(r.value)} />
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.slug}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => {
            const cover = resolveMediaUrl(item.cover_image_url);
            const countries = (item.countries ?? []).join(', ');
            return (
              <Pressable
                onPress={() => setAuthPromptOpen(true)}
                style={[styles.card, { width: cardWidth }]}
              >
                <LibraryCover uri={cover} width={cardWidth} height={cardWidth * 1.25} borderRadius={radii.lg} />
                <View style={styles.cardBody}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!!item.category?.name && (
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.category.name}
                    </Text>
                  )}
                  {!!countries && (
                    <Text style={styles.meta} numberOfLines={1}>
                      {countries}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No books match your filters.</Text>}
        />
      )}

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
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { margin: spacing.lg, color: colors.danger, textAlign: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
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
  meta: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: spacing['2xl'],
  },
});
