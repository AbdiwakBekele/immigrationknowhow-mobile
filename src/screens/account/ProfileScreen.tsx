import React from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ProviderProfileScreen } from './ProviderProfileScreen';
import { typography } from '../../theme/typography';

export function ProfileScreen() {
  const { user, role, signOut } = useAuth();

  if (role === 'provider') {
    return <ProviderProfileScreen />;
  }

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || 'Profile';

  return (
    <AppScreen variant="gradient" style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing['2xl'] }}>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted, letterSpacing: 1.6, fontWeight: typography.fontWeight.semibold }}>
        PROFILE
      </Text>
      <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
        Profile
      </Text>
      <Text style={{ marginTop: spacing.lg, fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: typography.fontWeight.medium }}>
        {name}
      </Text>
      {!!user?.email && (
        <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{user.email}</Text>
      )}
      <Text style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm, color: colors.text.muted }}>Role: {role ?? 'unknown'}</Text>

      <View style={{ flex: 1 }} />

      <AppButton title="Log out" onPress={() => void signOut()} variant="ghost" />
    </AppScreen>
  );
}
