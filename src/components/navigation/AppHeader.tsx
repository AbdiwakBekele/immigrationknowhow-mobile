import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerMenuButton } from '../DrawerMenuButton';
import { NotificationHeaderButton } from '../NotificationHeaderButton';
import { colors } from '../../theme/colors';
import { drawerGradient } from '../../theme/gradients';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const HEADER_BAR_HEIGHT = 56;

export type AppHeaderProps = NativeStackHeaderProps;

function headerCanvasVariant(options: NativeStackHeaderProps['options']): 'default' | 'drawer' {
  const v = (options as { appHeaderVariant?: 'default' | 'drawer' }).appHeaderVariant;
  return v === 'drawer' ? 'drawer' : 'default';
}

export function AppHeader(props: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const canvas = headerCanvasVariant(props.options);
  const title = props.options.title ?? props.route.name;
  const unreadCount =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props.route.params as any)?.unreadNotificationsCount != null
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Number((props.route.params as any).unreadNotificationsCount) || 0
      : 0;

  const iconColor = canvas === 'drawer' ? '#f8fafc' : colors.text.primary;
  const titleStyle = canvas === 'drawer' ? styles.titleDrawer : styles.title;

  return (
    <View
      style={[
        styles.wrap,
        canvas === 'drawer' && styles.wrapDrawer,
        { paddingTop: insets.top, height: HEADER_BAR_HEIGHT + insets.top },
      ]}
    >
      {canvas === 'drawer' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[...drawerGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <View style={styles.left}>
        {props.back ? (
          <Pressable
            onPress={props.navigation.goBack}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color={iconColor} />
          </Pressable>
        ) : (
          <DrawerMenuButton iconColor={iconColor} />
        )}
        <Text style={titleStyle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        <NotificationHeaderButton
          unreadCount={unreadCount}
          iconColor={iconColor}
          badgeBorderColor={canvas === 'drawer' ? '#0f172a' : colors.background}
          onPress={() => {
            // Keep navigation local to the current stack. If a screen named "Notifications"
            // exists in that stack, it will open; otherwise, this is a no-op.
            try {
              props.navigation.navigate('Notifications' as never);
            } catch {
              // ignore
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
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
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  wrapDrawer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'rgba(59,130,246,0.28)',
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
  titleDrawer: {
    flex: 1,
    color: '#f8fafc',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
});

