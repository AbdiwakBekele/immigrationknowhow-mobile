import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ONE_TIME_PURCHASE_LABEL } from '../../utils/money';

type Props = {
  compact?: boolean;
  center?: boolean;
  style?: StyleProp<TextStyle>;
};

export function OneTimePurchaseNote({ compact, center, style }: Props) {
  return (
    <Text style={[styles.note, compact && styles.noteCompact, center && styles.center, style]} numberOfLines={compact ? 3 : undefined}>
      {ONE_TIME_PURCHASE_LABEL}
    </Text>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  noteCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  center: {
    textAlign: 'center',
  },
});
