import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatMoney } from '../../utils/money';

export const EBOOK_ONE_TIME_LABEL = 'One-time purchase';

type Props = {
  price?: number;
  currency?: string;
  compact?: boolean;
  center?: boolean;
  showTitle?: boolean;
  style?: StyleProp<TextStyle>;
};

export function EbookPurchaseNote({
  price,
  currency = 'USD',
  compact,
  center,
  showTitle = true,
  style,
}: Props) {
  const priceLine =
    typeof price === 'number' && price > 0 ? `Buy Ebook — ${formatMoney(price, currency)}` : null;

  return (
    <View style={[styles.wrap, center && styles.centerWrap]}>
      {showTitle && !compact ? <Text style={[styles.title, center && styles.centerText]}>Ebook Purchase</Text> : null}
      {!compact ? (
        <Text style={[styles.body, center && styles.centerText]}>Unlock one ebook from the library.</Text>
      ) : null}
      {priceLine ? (
        <Text style={[styles.price, compact && styles.priceCompact, center && styles.centerText, style]}>{priceLine}</Text>
      ) : null}
      <Text style={[styles.note, compact && styles.noteCompact, center && styles.centerText, style]}>
        {EBOOK_ONE_TIME_LABEL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
    gap: 2,
  },
  centerWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  price: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  priceCompact: {
    fontSize: typography.fontSize.xs,
  },
  note: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  noteCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  centerText: {
    textAlign: 'center',
  },
});
