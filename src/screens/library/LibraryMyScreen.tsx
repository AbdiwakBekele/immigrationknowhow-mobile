import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { LibraryCover } from '../../components/library/LibraryCover';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import * as libraryApi from '../../api/libraryApi';
import type { LibraryStackParamList } from './LibraryStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const CARD_GAP = spacing.md;
const NUM_COLUMNS = 2;

function formatPrice(item: any): string {
  const amount = Number(item?.price || 0);
  if (!amount) return 'Free';
  return `${item.currency ?? 'USD'} ${amount.toFixed(2)}`;
}

export function LibraryMyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [tab, setTab] = useState<'purchased' | 'available'>('available');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

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

  return (
    <AppScreen style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
      <View style={s.tabRow}>
        <Pressable onPress={() => setTab('available')} style={[s.tab, tab === 'available' && s.tabActive]}>
          <Text style={[s.tabText, tab === 'available' && s.tabTextActive]}>Available</Text>
        </Pressable>
        <Pressable onPress={() => setTab('purchased')} style={[s.tab, tab === 'purchased' && s.tabActive]}>
          <Text style={[s.tabText, tab === 'purchased' && s.tabTextActive]}>Purchased</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {tab === 'purchased' ? 'No purchased titles yet.' : 'No titles available right now.'}
          </Text>
        </View>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: CARD_GAP }}
          keyExtractor={(it) => String(it.slug ?? it.id)}
          renderItem={({ item }) => {
            const cover = resolveMediaUrl(item.cover_image_url);
            const isPaid = Boolean(item.is_premium) || Number(item.price || 0) > 0;
            return (
              <Pressable
                onPress={() => item.slug && navigation.navigate('LibraryDetail', { slug: item.slug })}
                style={[s.card, { width: cardWidth }]}
              >
                <LibraryCover uri={cover} width={cardWidth} height={cardWidth * 1.25} borderRadius={radii.lg} />
                <View style={s.cardBody}>
                  <Text style={s.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={s.author} numberOfLines={1}>
                    {item.author ?? 'Unknown'}
                  </Text>
                  <Text style={s.meta}>
                    {item.type === 'audiobook' ? 'Audio' : item.has_audio_companion ? 'PDF + Audio' : 'PDF'}
                  </Text>
                </View>
                <View style={s.cardFooter}>
                  {tab === 'purchased' ? (
                    <Text style={[s.price, s.priceFree]}>Owned</Text>
                  ) : (
                    <Text style={[s.price, !isPaid && s.priceFree]}>{formatPrice(item)}</Text>
                  )}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        />
      )}
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
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardBody: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    flex: 1,
  },
  title: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    color: colors.text.primary,
  },
  author: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: colors.text.muted,
  },
  cardFooter: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  price: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  priceFree: {
    color: '#059669',
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
