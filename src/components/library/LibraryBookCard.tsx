import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LibraryCover } from './LibraryCover';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { OneTimePurchaseNote } from '../pricing/OneTimePurchaseNote';
import { formatPerUnit } from '../../utils/money';

export type LibraryBookItem = {
  slug?: string;
  title?: string;
  author?: string;
  price?: number | string;
  currency?: string;
  is_premium?: boolean;
  type?: string;
  has_audio_companion?: boolean;
  audio_file_path?: string;
  category?: { name?: string };
};

type Props = {
  item: LibraryBookItem;
  coverUri: string | null;
  onPress: () => void;
  variant?: 'grid' | 'compact';
  width?: number;
  owned?: boolean;
};

export function formatLibraryPrice(item: LibraryBookItem): string {
  const amount = Number(item?.price || 0);
  if (!amount) return 'Free';
  const unit = item?.type === 'audiobook' ? 'audiobook' : 'book';
  return formatPerUnit(amount, item.currency ?? 'USD', unit);
}

export function libraryItemHasPdf(item: LibraryBookItem): boolean {
  return item?.type === 'ebook';
}

export function libraryItemHasAudio(item: LibraryBookItem): boolean {
  return item?.type === 'audiobook' || !!item?.has_audio_companion || !!item?.audio_file_path;
}

function FormatChips({ item, compact }: { item: LibraryBookItem; compact?: boolean }) {
  const pdf = libraryItemHasPdf(item);
  const audio = libraryItemHasAudio(item);
  if (!pdf && !audio) return null;

  if (compact) {
    return (
      <View style={styles.chipRow}>
        {pdf ? <Ionicons name="document-text-outline" size={13} color={colors.primary[600]} /> : null}
        {audio ? <Ionicons name="headset-outline" size={13} color="#047857" /> : null}
      </View>
    );
  }

  return (
    <View style={styles.chipRow}>
      {pdf ? (
        <View style={[styles.chip, styles.chipEbook]}>
          <Ionicons name="document-text-outline" size={10} color={colors.primary[700] ?? colors.primary[600]} />
        </View>
      ) : null}
      {audio ? (
        <View style={[styles.chip, styles.chipAudio]}>
          <Ionicons name="headset-outline" size={10} color="#047857" />
        </View>
      ) : null}
    </View>
  );
}

export function LibraryBookCard({ item, coverUri, onPress, variant = 'grid', width, owned }: Props) {
  const isPaid = Boolean(item.is_premium) || Number(item.price || 0) > 0;
  const priceLabel = owned ? 'Owned' : formatLibraryPrice(item);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <LibraryCover uri={coverUri} width={52} height={68} borderRadius={radii.md} />
        <View style={styles.compactBody}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.compactAuthor} numberOfLines={1}>
            {item.author ?? 'Unknown author'}
          </Text>
          <View style={styles.compactMeta}>
            <FormatChips item={item} compact />
            {item.category?.name ? (
              <Text style={styles.compactCategory} numberOfLines={1}>
                {item.category.name}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.compactTrailing}>
          <Text style={[styles.compactPrice, (owned || !isPaid) && styles.priceFree]}>{priceLabel}</Text>
          {isPaid && !owned ? <OneTimePurchaseNote compact style={styles.compactOneTimeNote} /> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </View>
      </Pressable>
    );
  }

  const cardWidth = width ?? 160;
  const coverHeight = cardWidth * 1.2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.gridCard, { width: cardWidth }, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.coverWrap}>
        <LibraryCover uri={coverUri} width={cardWidth} height={coverHeight} borderRadius={radii.lg} />
        <View style={styles.coverTop}>
          <FormatChips item={item} />
        </View>
        <View style={styles.pricePill}>
          <Text style={[styles.pricePillText, !isPaid && !owned && styles.priceFree]} numberOfLines={1}>
            {priceLabel}
          </Text>
        </View>
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gridAuthor} numberOfLines={1}>
          {item.author ?? 'Unknown'}
        </Text>
        {isPaid && !owned ? <OneTimePurchaseNote compact style={styles.gridOneTimeNote} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.soft,
  },
  compactBody: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  compactAuthor: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    minWidth: 0,
  },
  compactCategory: {
    flex: 1,
    fontSize: 10,
    color: colors.text.secondary,
  },
  compactTrailing: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 108,
  },
  compactOneTimeNote: {
    textAlign: 'right',
  },
  compactPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'right',
  },
  gridCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.soft,
  },
  coverWrap: {
    position: 'relative',
  },
  coverTop: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  pricePill: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    maxWidth: '72%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15,23,42,0.72)',
  },
  pricePillText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  gridBody: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  gridTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  gridAuthor: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  gridOneTimeNote: {
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  chipEbook: {},
  chipAudio: {},
  priceFree: {
    color: '#34D399',
  },
});
