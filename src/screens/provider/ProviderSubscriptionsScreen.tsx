import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as subApi from '../../api/providerSubscriptionsApi';

function formatMoney(cents: number, currency: string): string {
  const v = cents / 100;
  return `${currency.toUpperCase()} ${v.toFixed(2)}`;
}

export function ProviderSubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<subApi.SubscriptionsPayload | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await subApi.getProviderSubscriptions();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setPayload(res.data.subscriptions);
  };

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [])
  );

  const checkout = async (planUuid: string) => {
    const res = await subApi.startSubscriptionCheckout(planUuid);
    if (!res.success) {
      Alert.alert('Checkout', res.message);
      return;
    }
    if (res.data.free_plan_activated) {
      Alert.alert('Subscription', res.message);
      void load(false);
      return;
    }
    const url = res.data.checkout_url;
    if (url) {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Checkout', 'Cannot open checkout URL.');
    }
  };

  const cancelSub = (uuid: string) => {
    Alert.alert('Cancel subscription', 'Cancel at period end?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          const res = await subApi.cancelSubscription(uuid);
          Alert.alert('Subscription', res.success ? res.message : res.message);
          void load(false);
        },
      },
    ]);
  };

  const resumeSub = async (uuid: string) => {
    const res = await subApi.resumeSubscription(uuid);
    Alert.alert('Subscription', res.success ? res.message : res.message);
    void load(false);
  };

  if (loading && !payload) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error && !payload) {
    return (
      <AppScreen style={{ padding: spacing.xl }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
        <Pressable onPress={() => void load(false)} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Retry</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const current = payload?.current_subscription;
  const plans = payload?.plans ?? [];

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      {!payload?.stripe_billing_configured && (
        <Text style={{ marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
          Stripe billing is not configured on the server.
        </Text>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        style={{ marginTop: spacing.lg }}
      >
        {current && (
          <View
            style={{
              padding: spacing.lg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              marginBottom: spacing.xl,
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>Current</Text>
            <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
              {current.plan?.name ?? 'Plan'} — {current.status}
            </Text>
            {current.cancel_at_period_end ? (
              <Pressable onPress={() => void resumeSub(current.uuid)} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Resume</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => cancelSub(current.uuid)} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.danger, fontWeight: typography.fontWeight.semibold }}>Cancel at period end</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.md }}>
          Available plans
        </Text>
        {plans.length === 0 ? (
          <Text style={{ color: colors.text.secondary }}>No plans available for your service types.</Text>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.uuid}
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{plan.name}</Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
                {plan.price_cents <= 0 ? 'Free' : formatMoney(plan.price_cents, plan.currency)}
                {plan.billing_cycle ? ` / ${plan.billing_cycle}` : ''}
              </Text>
              <Pressable
                onPress={() => void checkout(plan.uuid)}
                style={{
                  marginTop: spacing.md,
                  alignSelf: 'flex-start',
                  backgroundColor: colors.primary[600],
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>
                  {plan.price_cents <= 0 ? 'Activate' : 'Subscribe'}
                </Text>
              </Pressable>
              {current && plan.stripe_price_id && current.uuid && plan.uuid !== current.plan?.uuid && (
                <Pressable
                  onPress={async () => {
                    const res = await subApi.changeSubscriptionPlan(current.uuid, plan.uuid);
                    Alert.alert('Plan change', res.success ? res.message : res.message);
                    void load(false);
                  }}
                  style={{ marginTop: spacing.sm }}
                >
                  <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Switch to this plan</Text>
                </Pressable>
              )}
            </View>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}
