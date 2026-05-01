import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { colors } from '../theme/colors';

export type IonIconName = ComponentProps<typeof Ionicons>['name'];

export function tabBarIcon(name: IonIconName) {
  return function TabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

export const modernTabBarOptions: BottomTabNavigationOptions = {
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
  tabBarStyle: {
    backgroundColor: colors.surfaceElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    minHeight: Platform.OS === 'ios' ? 84 : 64,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
};
