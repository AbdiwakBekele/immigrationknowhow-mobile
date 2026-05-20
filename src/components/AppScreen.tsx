import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveContent } from './layout/ResponsiveContent';
import { colors } from '../theme/colors';
import { drawerGradient, screenGradient } from '../theme/gradients';

export function AppScreen({
  children,
  style,
  variant = 'default',
  safeAreaEdges = ['top', 'left', 'right'],
  constrained = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `muted` = soft slate canvas (auth). `gradient` = light brand gradient. `drawer` = same deep blue canvas as the side drawer. */
  variant?: 'default' | 'muted' | 'gradient' | 'drawer';
  /** Use `['left', 'right']` when a native stack header already applies the top inset. */
  safeAreaEdges?: Edge[];
  /** Center content and limit width on tablets / wide screens. */
  constrained?: boolean;
}) {
  const bg =
    variant === 'muted'
      ? colors.backgroundMuted
      : variant === 'gradient' || variant === 'drawer'
        ? 'transparent'
        : colors.background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={safeAreaEdges}>
      {variant === 'gradient' ? (
        <LinearGradient colors={[...screenGradient]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFillObject} />
      ) : null}
      {variant === 'drawer' ? (
        <LinearGradient colors={[...drawerGradient]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
      ) : null}
      {constrained ? (
        <ResponsiveContent style={style} fill>
          {children}
        </ResponsiveContent>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
