import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { CommunityPostFeedCard, type CommunityFeedEngagement } from '../../components/community/CommunityPostFeedCard';
import { CommunityShareSheet } from '../../components/community/CommunityShareSheet';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as communityApi from '../../api/communityApi';
import type { CommunityPostPayload } from '../../api/communityApi';
import type { CommunityStackParamList } from './CommunityStack';
import { COMMUNITY_SECTION_LABELS } from '../../utils/communityDisplay';

const SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'feed', label: COMMUNITY_SECTION_LABELS.feed },
  { key: 'immigration-legal', label: COMMUNITY_SECTION_LABELS['immigration-legal'] },
  { key: 'career-finance', label: COMMUNITY_SECTION_LABELS['career-finance'] },
  { key: 'health-wellness', label: COMMUNITY_SECTION_LABELS['health-wellness'] },
  { key: 'daily-living', label: COMMUNITY_SECTION_LABELS['daily-living'] },
  { key: 'culture-community', label: COMMUNITY_SECTION_LABELS['culture-community'] },
];

function buildEngagement(post: CommunityPostPayload): CommunityFeedEngagement {
  const reactions = new Set(post.user_reactions ?? []);
  return {
    liked: reactions.has('like'),
    bookmarked: reactions.has('bookmark'),
    likes: post.likes_count ?? 0,
    comments: post.comments_count ?? 0,
    shares: post.shares_count ?? 0,
    bookmarks: post.bookmarks_count ?? 0,
  };
}

function mergeEngagement(
  posts: CommunityPostPayload[],
  existing: Record<number, CommunityFeedEngagement>,
): Record<number, CommunityFeedEngagement> {
  const next = { ...existing };
  for (const post of posts) {
    if (!next[post.id]) {
      next[post.id] = buildEngagement(post);
    }
  }
  return next;
}

export function CommunityListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<CommunityPostPayload[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState('feed');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sharePost, setSharePost] = useState<CommunityPostPayload | null>(null);
  const [engagement, setEngagement] = useState<Record<number, CommunityFeedEngagement>>({});
  const [reactingPostId, setReactingPostId] = useState<number | null>(null);

  const sectionTitle = useMemo(() => COMMUNITY_SECTION_LABELS[category] ?? 'Community', [category]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(
    async (opts: { refresh?: boolean; page?: number; append?: boolean; activeSearch?: string } = {}) => {
      const { refresh = false, page: pageToLoad = 1, append = false } = opts;
      const activeSearch = opts.activeSearch ?? search;

      if (refresh) {
        setRefreshing(true);
      } else if (append) {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await communityApi.listCommunityPosts({
        page: pageToLoad,
        ...(category !== 'feed' ? { category } : {}),
        ...(activeSearch ? { search: activeSearch } : {}),
      });

      if (refresh) setRefreshing(false);
      else if (append) setLoadingMore(false);
      else setLoading(false);

      if (!res.success) return;

      const pageData = res.data?.posts;
      const nextPosts = pageData?.data ?? [];
      const currentPage = pageData?.current_page ?? pageToLoad;
      const lastPage = pageData?.last_page ?? currentPage;

      setPage(currentPage);
      setHasMore(currentPage < lastPage);

      if (append) {
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...nextPosts.filter((p) => !seen.has(p.id))];
        });
        setEngagement((eng) => mergeEngagement(nextPosts, eng));
      } else {
        setPosts(nextPosts);
        setEngagement(
          nextPosts.reduce<Record<number, CommunityFeedEngagement>>((acc, post) => {
            acc[post.id] = buildEngagement(post);
            return acc;
          }, {}),
        );
      }
    },
    [category, hasMore, loadingMore, search],
  );

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      void load({ page: 1 });
      // Intentionally depend on category/search so results refresh when either changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, search]),
  );

  const onSearchSubmit = () => {
    setSearch(searchDraft.trim());
  };

  const clearSearch = () => {
    setSearchDraft('');
    setSearch('');
  };

  const loadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    void load({ page: page + 1, append: true });
  };

  const updateEngagement = (postId: number, patch: Partial<CommunityFeedEngagement>) => {
    setEngagement((current) => ({
      ...current,
      [postId]: {
        ...(current[postId] ?? { liked: false, bookmarked: false, likes: 0, comments: 0, shares: 0, bookmarks: 0 }),
        ...patch,
      },
    }));
  };

  const onToggleReaction = async (postId: number, type: 'like' | 'bookmark') => {
    if (reactingPostId != null) return;
    setReactingPostId(postId);
    const res = await communityApi.reactToCommunityPost(postId, type);
    setReactingPostId(null);
    if (!res.success) {
      Alert.alert('Could not update', res.message);
      return;
    }
    const data = res.data;
    if (!data) return;
    updateEngagement(postId, {
      likes: data.counts.likes_count,
      comments: data.counts.comments_count,
      shares: data.counts.shares_count,
      bookmarks: data.counts.bookmarks_count,
      ...(type === 'like' ? { liked: data.active } : {}),
      ...(type === 'bookmark' ? { bookmarked: data.active } : {}),
    });
  };

  const recordShare = async (postId: number) => {
    const res = await communityApi.reactToCommunityPost(postId, 'share');
    if (!res.success || !res.data?.counts) return;
    updateEngagement(postId, {
      shares: res.data.counts.shares_count,
    });
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.screenEyebrow}>Community feed</Text>
          <Text style={styles.screenTitle}>{sectionTitle}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('CommunityNews')}
          style={({ pressed }) => [styles.newsBtn, pressed && styles.newsBtnPressed]}
          hitSlop={8}
        >
          <View style={styles.newsBtnIconWrap}>
            <Ionicons name="newspaper-outline" size={16} color={colors.primary[700]} />
          </View>
          <Text style={styles.newsBtnText}>News</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <View style={styles.chipsInner}>
          {SECTIONS.map((s) => {
            const active = category === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setCategory(s.key)}
                style={({ pressed }) => [
                  styles.sectionChip,
                  active ? styles.sectionChipActive : null,
                  pressed && (active ? styles.sectionChipPressedActive : styles.sectionChipPressed),
                ]}
              >
                <Text style={[styles.sectionChipText, active ? styles.sectionChipTextActive : null]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.searchActionsRow}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color={colors.text.muted} style={styles.searchIcon} />
          <TextInput
            placeholder={`Search in ${sectionTitle}...`}
            placeholderTextColor={colors.text.muted}
            value={searchDraft}
            onChangeText={setSearchDraft}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchDraft.length > 0 ? (
            <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onSearchSubmit} style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}>
          <Text style={styles.searchButtonText}>Search</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text.inverse} />
        </Pressable>
      </View>
      {loading && <ActivityIndicator style={{ marginBottom: spacing.lg }} color={colors.primary[600]} />}
    </View>
  );

  return (
    <AppScreen style={styles.screen}>
      <FlatList
        data={loading ? [] : posts}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              setHasMore(true);
              void load({ refresh: true, page: 1 });
            }}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary[600]} />
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.text.muted} />
              <Text style={styles.emptyText}>
                {search
                  ? 'No posts match your search. Try another term or category.'
                  : 'No posts found for this section. Try another category or search.'}
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const postEngagement = engagement[item.id] ?? buildEngagement(item);
          return (
            <CommunityPostFeedCard
              post={item}
              engagement={postEngagement}
              reacting={reactingPostId === item.id}
              onOpen={() => navigation.navigate('CommunityPost', { id: item.id })}
              onLike={() => void onToggleReaction(item.id, 'like')}
              onComment={() => navigation.navigate('CommunityPost', { id: item.id, focusComments: true })}
              onShare={() => setSharePost(item)}
              onBookmark={() => void onToggleReaction(item.id, 'bookmark')}
            />
          );
        }}
      />
      <CommunityShareSheet
        visible={!!sharePost}
        postId={sharePost?.id ?? 0}
        postTitle={sharePost?.title ?? ''}
        onClose={() => setSharePost(null)}
        onShared={sharePost ? () => recordShare(sharePost.id) : undefined}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  headerBlock: {
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  screenEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#64748B',
  },
  screenTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#111827',
    letterSpacing: -0.2,
  },
  newsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.full,
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#C7D7FE',
    ...shadows.soft,
  },
  newsBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  newsBtnIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBE8FF',
  },
  newsBtnText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  chipsScroll: {
    marginTop: spacing.md,
  },
  chipsInner: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  sectionChip: {
    paddingVertical: spacing.xs + 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#D9E2F0',
    backgroundColor: '#F8FAFC',
    ...shadows.soft,
  },
  sectionChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  sectionChipPressed: {
    opacity: 0.88,
  },
  sectionChipPressedActive: {
    opacity: 0.94,
  },
  sectionChipText: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },
  sectionChipTextActive: {
    color: colors.text.inverse,
  },
  searchActionsRow: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    ...shadows.soft,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
    ...shadows.soft,
  },
  searchButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  searchButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    paddingVertical: spacing['2xl'],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9D5E6',
    backgroundColor: colors.surfaceElevated,
  },
  emptyText: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    color: '#64748B',
    fontSize: typography.fontSize.sm,
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
});
