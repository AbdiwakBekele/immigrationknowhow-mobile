import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../components/AppScreen';
import { ProviderSubscriptionsScreen } from '../screens/provider/ProviderSubscriptionsScreen';
import * as subApi from '../api/providerSubscriptionsApi';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { providerRequiresSubscription } from '../utils/providerSubscription';

type Props = {
  children: React.ReactNode;
};

export function ProviderSubscriptionGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const evaluate = useCallback(async () => {
    const res = await subApi.getProviderSubscriptions();
    if (!res.success) {
      setBlocked(true);
      setLoading(false);
      return;
    }
    setBlocked(providerRequiresSubscription(res.data.subscriptions));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void evaluate();
    }, [evaluate]),
  );

  if (loading) {
    return (
      <AppScreen variant="gradient" style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (blocked) {
    return <ProviderSubscriptionsScreen requiredMode onSubscriptionActive={() => void evaluate()} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
});
