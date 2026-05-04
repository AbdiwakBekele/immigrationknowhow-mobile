import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function NotificationsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.sub}>Your notifications will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  sub: {
    marginTop: spacing.sm,
    color: colors.text.muted,
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});

