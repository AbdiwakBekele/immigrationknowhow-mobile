import React from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <AppScreen>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center' }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          {title}
        </Text>
        <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
          This screen is wired into navigation. Next we’ll implement the full feature parity for this section.
        </Text>
      </View>
    </AppScreen>
  );
}

