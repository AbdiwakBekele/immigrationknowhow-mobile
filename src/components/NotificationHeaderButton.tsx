import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  unreadCount: number;
  onPress: () => void;
};

/**
 * Header control: notification bell + red badge when there are unread items.
 */
export function NotificationHeaderButton({ unreadCount, onPress }: Props) {
  const n = Math.max(0, Math.floor(unreadCount));
  const label = n > 99 ? '99+' : String(n);
  const showBadge = n > 0;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.hit}
      accessibilityRole="button"
      accessibilityLabel={showBadge ? `Notifications, ${n} unread` : 'Notifications'}
    >
      <View style={styles.wrap}>
        <Ionicons name="notifications-outline" size={26} color={colors.primary[600]} />
        {showBadge ? (
          <View style={[styles.badge, label.length > 1 ? styles.badgeWide : null]}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  wrap: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeWide: {
    minWidth: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
