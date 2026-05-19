import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  visible: boolean;
  onMarkAllRead: () => void;
  busy?: boolean;
};

export function NotificationsHeaderActions({ visible, onMarkAllRead, busy }: Props) {
  if (!visible) return null;

  return (
    <Pressable
      onPress={onMarkAllRead}
      disabled={busy}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, (pressed || busy) && styles.btnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Mark all notifications as read"
    >
      <Text style={styles.btnText}>Mark all read</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
