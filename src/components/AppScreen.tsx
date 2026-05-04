import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { drawerGradient, screenGradient } from '../theme/gradients';

export function AppScreen({
  children,
  style,
  variant = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `muted` = soft slate canvas (auth). `gradient` = light brand gradient. `drawer` = same deep blue canvas as the side drawer. */
  variant?: 'default' | 'muted' | 'gradient' | 'drawer';
}) {
  const bg =
    variant === 'muted'
      ? colors.backgroundMuted
      : variant === 'gradient' || variant === 'drawer'
        ? 'transparent'
        : colors.background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      {variant === 'gradient' ? (
        <LinearGradient colors={[...screenGradient]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFillObject} />
      ) : null}
      {variant === 'drawer' ? (
        <LinearGradient colors={[...drawerGradient]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
      ) : null}
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </SafeAreaView>
  );
}
