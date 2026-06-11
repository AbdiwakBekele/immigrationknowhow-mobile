import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { LibraryCover } from '../../components/library/LibraryCover';
import { formatLibraryPrice } from '../../components/library/LibraryBookCard';
import { OneTimePurchaseNote } from '../../components/pricing/OneTimePurchaseNote';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import * as libraryApi from '../../api/libraryApi';
import type { LibraryStackParamList } from './LibraryStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const CARD_GAP = spacing.md;
const NUM_COLUMNS = 2;

export function LibraryBrowseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.xl * 2 - CARD_GAP) / NUM_COLUMNS;

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.browseLibrary({ per_page: 20 });
    setLoading(false);
    if (!res.success) {
      setErr(res.message);
      return;
    }
    setItems(res.data?.items?.data?.data ?? res.data?.items?.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.navigate('LibraryMy')}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Purchased</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : err ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{err}</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: CARD_GAP }}
          keyExtractor={(it) => String(it.slug)}
          renderItem={({ item }) => {
            const cover = resolveMediaUrl(item.cover_image_url);
            const isPaid = Boolean(item.is_premium) || Number(item.price || 0) > 0;
            return (
              <Pressable
                onPress={() => navigation.navigate('LibraryDetail', { slug: item.slug })}
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
                  <Text style={[s.price, !isPaid && s.priceFree]}>{formatLibraryPrice(item)}</Text>
                  {isPaid ? <OneTimePurchaseNote compact style={s.oneTimeNote} /> : null}
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
  oneTimeNote: {
    marginTop: 4,
  },
});
