import React from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfileScreen() {
  const { user, role, signOut } = useAuth();

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
        {user?.first_name} {user?.last_name} ({user?.email})
      </Text>
      <Text style={{ marginTop: spacing.xs, color: colors.text.muted }}>Role: {role ?? 'unknown'}</Text>

      <View style={{ flex: 1 }} />

      <AppButton title="Logout" onPress={() => void signOut()} variant="ghost" />
    </AppScreen>
  );
}

