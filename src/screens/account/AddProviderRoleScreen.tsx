import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { OnboardingHomeScreen } from '../onboarding/OnboardingHomeScreen';
import { useAuth } from '../../context/AuthContext';
import * as rolesApi from '../../api/rolesApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import type { ProfileStackParamList } from './ProfileStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function AddProviderRoleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { refreshMe, setActiveRole } = useAuth();
  const [starting, setStarting] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setStarting(true);
      setError(null);
      const res = await rolesApi.startProvider();
      if (!active) return;
      setStarting(false);
      if (!res.success) {
        setError(friendlyApiErrorMessage(res));
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const onFlowComplete = useCallback(async () => {
    await refreshMe();
    await setActiveRole('provider');
    navigation.goBack();
  }, [navigation, refreshMe, setActiveRole]);

  if (starting) {
    return (
      <AppScreen style={styles.centered}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </AppScreen>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <OnboardingHomeScreen
      flow="addProvider"
      onFlowComplete={() => void onFlowComplete()}
      onCheckoutRequired={(checkoutUrl) => navigation.navigate('StripeCheckout', { checkoutUrl })}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
