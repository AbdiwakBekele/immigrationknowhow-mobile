import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export function AuthFlowProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const safeTotal = Math.max(1, totalSteps);
  const denom = Math.max(1, safeTotal - 1);
  const pct = Math.min(100, Math.max(0, ((currentStep - 1) / denom) * 100));
  const widthPct = Number.isFinite(pct) ? pct : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary[400], colors.primary[700]]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${widthPct}%` }]}
        />
      </View>
      <Text style={styles.caption}>
        Step {currentStep} of {safeTotal}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary[50],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  caption: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
