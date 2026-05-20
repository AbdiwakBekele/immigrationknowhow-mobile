import React from 'react';
import { Platform, useWindowDimensions, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export type IonIconName = ComponentProps<typeof Ionicons>['name'];

export function tabBarIcon(name: IonIconName) {
  return function TabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

function baseTabBarStyle(insets: { bottom: number }): ViewStyle {
  const baseBottomPad = Platform.OS === 'ios' ? 12 : 10;
  const baseMinHeight = Platform.OS === 'ios' ? 72 : 64;

  return {
    backgroundColor: colors.surfaceElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: baseBottomPad + insets.bottom,
    minHeight: baseMinHeight + insets.bottom,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  };
}

function sharedTabBarOptions(tabBarStyle: ViewStyle): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary[600],
    tabBarInactiveTintColor: colors.text.muted,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.2,
      marginTop: 2,
    },
    tabBarItemStyle: {
      paddingTop: 4,
    },
    tabBarStyle,
  };
}

function fullWidthTabBarStyle(insets: { bottom: number }, windowWidth: number): ViewStyle {
  return {
    ...baseTabBarStyle(insets),
    width: '100%',
    alignSelf: 'stretch',
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          width: windowWidth,
          zIndex: 50,
        }
      : null),
  };
}

/** Full-width bottom tab bar for seeker, provider, and advertiser. */
export function useModernTabBarOptions(): BottomTabNavigationOptions {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  return sharedTabBarOptions(fullWidthTabBarStyle(insets, windowWidth));
}

/** @deprecated Use useModernTabBarOptions — same full-width behavior. */
export function useAdvertiserTabBarOptions(): BottomTabNavigationOptions {
  return useModernTabBarOptions();
}
