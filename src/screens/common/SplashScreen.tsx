import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function SplashScreen() {
  return (
    <AppScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary, fontSize: typography.fontSize.md }}>
          Loading…
        </Text>
      </View>
    </AppScreen>
  );
}

