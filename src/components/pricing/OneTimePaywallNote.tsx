import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatMoney } from '../../utils/money';

type Props = {
  title: string;
  description: string;
  priceCents: number;
  currency?: string;
  priceSuffix?: string;
};

/** Disclosure block for one-time IAP purchases (ebooks, ads). */
export function OneTimePaywallNote({ title, description, priceCents, currency = 'USD', priceSuffix }: Props) {
  const price = formatMoney(priceCents / 100, currency);
  const priceLine = priceSuffix ? `${price} ${priceSuffix}` : price;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>{priceLine}</Text>
      <Text style={styles.body}>{description}</Text>
      <Text style={styles.note}>One-time purchase (not a subscription)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  note: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
