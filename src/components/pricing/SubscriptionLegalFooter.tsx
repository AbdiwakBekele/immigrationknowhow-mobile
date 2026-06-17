import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTO_RENEW_SUBSCRIPTION_DISCLOSURE, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../config/legal';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { shouldUseAppleIap } from '../../utils/platformPayments';

type Props = {
  onRestore?: () => void;
  restoring?: boolean;
  showRestore?: boolean;
};

export function SubscriptionLegalFooter({ onRestore, restoring = false, showRestore = true }: Props) {
  const showRestoreButton = showRestore && onRestore && shouldUseAppleIap();

  return (
    <View style={styles.wrap}>
      <Text style={styles.disclosure}>{AUTO_RENEW_SUBSCRIPTION_DISCLOSURE}</Text>
      <View style={styles.linksRow}>
        <Pressable
          onPress={() => void openExternalUrl(PRIVACY_POLICY_URL)}
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
        >
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.separator}>·</Text>
        <Pressable
          onPress={() => void openExternalUrl(TERMS_OF_USE_URL)}
          accessibilityRole="link"
          accessibilityLabel="Terms of Use EULA"
        >
          <Text style={styles.link}>Terms of Use (EULA)</Text>
        </Pressable>
      </View>
      {showRestoreButton ? (
        <Pressable
          onPress={onRestore}
          disabled={restoring}
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel="Restore Purchases"
        >
          {restoring ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  disclosure: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  link: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  separator: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
