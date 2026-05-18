import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  unreadCount: number;
  onArchive: () => void;
  iconColor?: string;
};

export function MessagesHeaderActions({ unreadCount, onArchive, iconColor = colors.text.primary }: Props) {
  const count = Math.max(0, Math.floor(unreadCount));

  return (
    <View style={styles.row}>
      <View
        style={[styles.unreadPill, count === 0 && styles.unreadPillEmpty]}
        accessibilityRole="text"
        accessibilityLabel={count > 0 ? `${count} unread messages` : 'No unread messages'}
      >
        <Ionicons
          name="mail-unread-outline"
          size={16}
          color={count > 0 ? colors.primary[700] : colors.text.muted}
        />
        <Text style={[styles.unreadText, count === 0 && styles.unreadTextEmpty]}>
          {count > 0 ? `${count} unread` : 'Unread'}
        </Text>
      </View>
      <Pressable
        onPress={onArchive}
        hitSlop={10}
        style={({ pressed }) => [styles.archiveBtn, pressed && styles.archiveBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Archived messages"
      >
        <Ionicons name="archive-outline" size={22} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    maxWidth: 108,
  },
  unreadPillEmpty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  unreadText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  unreadTextEmpty: {
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  archiveBtn: {
    padding: 6,
    borderRadius: radii.md,
  },
  archiveBtnPressed: {
    opacity: 0.7,
    backgroundColor: colors.backgroundMuted,
  },
});
