import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerMenuButton } from '../DrawerMenuButton';
import { NotificationHeaderButton } from '../NotificationHeaderButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const HEADER_BAR_HEIGHT = 56;

export function AppHeader(props: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = props.options.title ?? props.route.name;
  const unreadCount =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props.route.params as any)?.unreadNotificationsCount != null
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Number((props.route.params as any).unreadNotificationsCount) || 0
      : 0;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, height: HEADER_BAR_HEIGHT + insets.top }]}>
      <View style={styles.left}>
        <DrawerMenuButton iconColor={colors.text.primary} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <NotificationHeaderButton
        unreadCount={unreadCount}
        onPress={() => {
          // Keep navigation local to the current stack. If a screen named "Notifications"
          // exists in that stack, it will open; otherwise, this is a no-op.
          try {
            // @ts-expect-error: route name is app-defined per-stack
            props.navigation.navigate('Notifications');
          } catch {
            // ignore
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
});

