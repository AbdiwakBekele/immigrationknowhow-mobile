import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppImage } from '../../components/AppImage';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as communityApi from '../../api/communityApi';
import type { CommunityPostPayload } from '../../api/communityApi';
import type { CommunityStackParamList } from './CommunityStack';
import { communityDescriptionPlainText } from '../../utils/communityContent';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'feed', label: 'Feed' },
  { key: 'immigration-legal', label: 'Immigration & legal' },
  { key: 'career-finance', label: 'Career & finance' },
  { key: 'health-wellness', label: 'Health & wellness' },
  { key: 'daily-living', label: 'Daily living' },
  { key: 'culture-community', label: 'Culture & community' },
];

export function CommunityListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<CommunityPostPayload[]>([]);
  const [category, setCategory] = useState('feed');
  const [search, setSearch] = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await communityApi.listCommunityPosts({
      category,
      search: search.trim(),
    });
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) return;
    setPosts(res.data?.posts?.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [category])
  );

  const onSearchSubmit = () => void load();

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Community</Text>
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
            placeholder="Search posts…"
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            style={styles.searchInput}
          />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.text.muted} />
              <Text style={styles.emptyText}>No posts in this section.</Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('CommunityPost', { id: item.id })}
            style={styles.postCard}
          >
            <View style={styles.postRow}>
              {item.image_url ? (
                <AppImage
                  uri={resolveMediaUrl(item.image_url)}
                  style={styles.thumb}
                  contentFit="cover"
                  height={THUMB}
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="document-text-outline" size={28} color={colors.text.muted} />
                </View>
              )}
              <View style={styles.postTextCol}>
                <Text style={styles.postTitle} numberOfLines={2}>
                  {item.title ?? `Post #${item.id}`}
                </Text>
                {!!item.tag && <Text style={styles.postTag}>{item.tag}</Text>}
                {!!item.description && (
                  <Text style={styles.postDesc} numberOfLines={2}>
                    {communityDescriptionPlainText(item.description)}
                  </Text>
                )}
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Ionicons name="heart-outline" size={15} color={colors.text.muted} />
                    <Text style={styles.metricText}>{item.likes_count ?? 0}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="chatbubble-outline" size={15} color={colors.text.muted} />
                    <Text style={styles.metricText}>{item.comments_count ?? 0}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="share-outline" size={15} color={colors.text.muted} />
                    <Text style={styles.metricText}>{item.shares_count ?? 0}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </AppScreen>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.sm,
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
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
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
    borderColor: '#A7C4FE',
    backgroundColor: '#E9F1FF',
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
    color: colors.primary[800],
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    ...shadows.soft,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
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
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
  },
  postCard: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    ...shadows.soft,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    marginRight: spacing.md,
  },
  thumbPlaceholder: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTextCol: {
    flex: 1,
    minWidth: 0,
  },
  postTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  postTag: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  postDesc: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
});
