import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../AppScreen';
import { AppButton } from '../AppButton';
import { AppInput } from '../AppInput';
import { useAuth } from '../../context/AuthContext';
import * as rolesApi from '../../api/rolesApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import type { ProfileStackParamList } from '../../screens/account/ProfileStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function RoleAccountSection() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { role, hasRole, setActiveRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<rolesApi.RoleMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await rolesApi.getRoleMeta();
    setLoading(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setMeta(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary[600]} />
      </View>
    );
  }

  if (!meta) {
    return error ? <Text style={styles.errorText}>{error}</Text> : null;
  }

  const showSwitcher = meta.can_switch;
  const showAddSeeker = meta.can_add_seeker;
  const showAddProvider = meta.can_add_provider;

  if (!showSwitcher && !showAddSeeker && !showAddProvider) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Account roles</Text>
      <Text style={styles.help}>
        Use one login for both service seeker and provider experiences. Switch anytime without signing out.
      </Text>

      {showSwitcher ? (
        <View style={styles.switchRow}>
          <RoleChip
            label="Service seeker"
            active={role === 'user'}
            onPress={() => void setActiveRole('user')}
            disabled={!hasRole('user')}
          />
          <RoleChip
            label="Service provider"
            active={role === 'provider'}
            onPress={() => void setActiveRole('provider')}
            disabled={!hasRole('provider')}
          />
        </View>
      ) : null}

      {showAddSeeker ? (
        <AppButton
          title="Create service seeker account"
          onPress={() => navigation.navigate('AddSeekerRole')}
          variant="secondary"
          style={styles.actionButton}
        />
      ) : null}

      {showAddProvider ? (
        <AppButton
          title="Create service provider account"
          onPress={() => navigation.navigate('AddProviderRole')}
          variant="secondary"
          style={styles.actionButton}
        />
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function RoleChip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, active ? styles.chipActive : null, disabled ? styles.chipDisabled : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  help: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.primary[700],
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
});
