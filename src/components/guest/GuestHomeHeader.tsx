import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandWordmark } from '../BrandWordmark';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export function GuestHomeHeader({ onSignIn, onSignUp }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <BrandWordmark width={180} />
      <View style={styles.actions}>
        <Pressable onPress={onSignIn} style={styles.signInButton} hitSlop={8}>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={onSignUp} style={styles.signUpButton} hitSlop={8}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </Pressable>
      </View>
      <Text style={styles.guestBadge}>Browsing as guest</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  signInButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signInText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  signUpButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
  },
  signUpText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  guestBadge: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
