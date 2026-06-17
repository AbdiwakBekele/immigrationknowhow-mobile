import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  label?: string;
};

export function PaidFeatureBadge({ label = 'Requires subscription' }: Props) {
  return (
    <View style={styles.badge} accessibilityRole="text">
      <Ionicons name="lock-closed" size={12} color={colors.primary[700]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
