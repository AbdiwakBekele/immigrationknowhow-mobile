import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function AccountMatchingNotice() {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.iconWrap}>
        <Ionicons name="information-circle-outline" size={22} color={colors.primary[700]} />
      </View>
      <Text style={styles.text}>
        ImmigrantKnowHow uses account information such as location, spoken language, and optional provider
        preferences to provide relevant matches between service seekers and service providers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginBottom: spacing.xl,
  },
  iconWrap: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.primary[900],
    fontWeight: typography.fontWeight.medium,
  },
});
