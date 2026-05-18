import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export function AuthFlowProgressBar({
  currentStep,
  totalSteps,
  variant = 'bar',
}: {
  currentStep: number;
  totalSteps: number;
  /** `numbered` matches web `AuthFlowProgress.vue` (signup steps 1–4). */
  variant?: 'bar' | 'numbered';
}) {
  const safeTotal = Math.max(1, totalSteps);

  if (variant === 'numbered') {
    const steps = Array.from({ length: safeTotal }, (_, i) => i + 1);
    return (
      <View style={styles.wrap} accessibilityRole="progressbar">
        <View style={styles.numberedRow}>
          {steps.map((n, idx) => {
            const done = n < currentStep;
            const active = n === currentStep;
            return (
              <React.Fragment key={n}>
                <View style={[styles.dot, done || active ? styles.dotActive : styles.dotIdle, active && styles.dotCurrent]}>
                  <Text style={[styles.dotText, done || active ? styles.dotTextActive : styles.dotTextIdle]}>{n}</Text>
                </View>
                {idx < steps.length - 1 ? (
                  <View style={[styles.connector, n < currentStep ? styles.connectorDone : styles.connectorIdle]} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={styles.caption}>
          Step {currentStep} of {safeTotal}
        </Text>
      </View>
    );
  }

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
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.primary[600],
  },
  dotCurrent: {
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dotIdle: {
    backgroundColor: '#CBD5E1',
  },
  dotText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  dotTextActive: {
    color: colors.text.inverse,
  },
  dotTextIdle: {
    color: '#475569',
  },
  connector: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  connectorDone: {
    backgroundColor: colors.primary[500],
  },
  connectorIdle: {
    backgroundColor: '#E2E8F0',
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
