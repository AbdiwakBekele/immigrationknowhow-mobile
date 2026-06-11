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
import { purchaseProviderSubscription, restoreApplePurchasesOnDevice } from '../../services/appleIapService';
import { isPaidBillingAvailable, openAppleSubscriptionManagement, shouldUseAppleIap } from '../../utils/platformPayments';
import { formatSubscriptionPrice } from '../../utils/money';

function isAppleBilledSubscription(sub: subApi.ProviderSubscriptionRow | null | undefined): boolean {
  if (!sub) return false;
  return Boolean(sub.apple_original_transaction_id?.trim()) && !sub.stripe_subscription_id?.trim();
}

export function ProviderSubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribingUuid, setSubscribingUuid] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<subApi.SubscriptionsPayload | null>(null);

  const useAppleIap = shouldUseAppleIap();

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
    }, []),
  );

  const subscribeToPlan = async (plan: subApi.SubscriptionPlanRow, options?: { switching?: boolean }) => {
    if (plan.price_cents <= 0) {
      const res = await subApi.startSubscriptionCheckout(plan.uuid);
      if (!res.success) {
        Alert.alert('Subscription', res.message);
        return;
      }
      if (res.data.free_plan_activated) {
        Alert.alert('Subscription', res.message);
        void load(false);
      }
      return;
    }

    if (useAppleIap) {
      const appleProductId = plan.apple_product_id?.trim();
      if (!appleProductId) {
        Alert.alert('Subscription', 'This plan is not available for In-App Purchase yet.');
        return;
      }

      setSubscribingUuid(plan.uuid);
      try {
        await purchaseProviderSubscription(plan.uuid, appleProductId);
        await load(false);
        Alert.alert(
          'Subscription',
          options?.switching
            ? 'Your plan change was submitted to the App Store. It may take a moment to update.'
            : 'Your provider plan is now active.',
        );
      } catch (e) {
        Alert.alert('Subscription', e instanceof Error ? e.message : 'Purchase could not be completed.');
      } finally {
        setSubscribingUuid(null);
      }
      return;
    }

    const res = await subApi.startSubscriptionCheckout(plan.uuid);
    if (!res.success) {
      Alert.alert('Checkout', res.message);
      return;
    }
    const url = res.data.checkout_url;
    if (url) {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Checkout', 'Cannot open checkout URL.');
    }
  };

  const restorePurchases = async () => {
    setRestoring(true);
    try {
      const result = await restoreApplePurchasesOnDevice();
      await load(false);
      const detail =
        result.errors.length > 0
          ? `\n\nSome items could not be restored:\n${result.errors.slice(0, 3).join('\n')}`
          : '';
      Alert.alert(
        'Restore purchases',
        `${result.provider_subscription_active ? 'Provider subscription is active.' : 'No provider subscription was restored.'}${
          result.ai_assistant_active ? ' AI Assistant is active.' : ''
        }${result.library_restored > 0 ? ` ${result.library_restored} library title(s) restored.` : ''}${detail}`,
      );
    } catch (e) {
      Alert.alert('Restore purchases', e instanceof Error ? e.message : 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const current = payload?.current_subscription ?? null;

  const cancelSub = (sub: subApi.ProviderSubscriptionRow) => {
    if (isAppleBilledSubscription(sub)) {
      Alert.alert(
        'Manage subscription',
        'This subscription is billed through the App Store. Cancel or change renewal in iPhone Settings → Apple ID → Subscriptions.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Subscriptions', onPress: () => void openAppleSubscriptionManagement() },
        ],
      );
      return;
    }

    Alert.alert('Cancel subscription', 'Cancel at period end?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          const res = await subApi.cancelSubscription(sub.uuid);
          Alert.alert('Subscription', res.message);
          void load(false);
        },
      },
    ]);
  };

  const resumeSub = async (sub: subApi.ProviderSubscriptionRow) => {
    if (isAppleBilledSubscription(sub)) {
      Alert.alert(
        'Manage subscription',
        'Resume or change this subscription in iPhone Settings → Apple ID → Subscriptions.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Subscriptions', onPress: () => void openAppleSubscriptionManagement() },
        ],
      );
      return;
    }

    const res = await subApi.resumeSubscription(sub.uuid);
    Alert.alert('Subscription', res.message);
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

  const plans = payload?.plans ?? [];
  const billingConfigured =
    payload?.subscription_billing_configured ??
    (payload?.stripe_billing_configured || (useAppleIap && payload?.apple_iap_configured));

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      {!billingConfigured && (
        <Text style={{ marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
          {useAppleIap
            ? 'In-App Purchase billing is not fully configured on the server yet.'
            : 'Online billing is not configured on the server.'}
        </Text>
      )}

      {payload?.provider_subscription_promo?.trial_eligible &&
      (payload.provider_subscription_promo.trial_months ?? 0) > 0 ? (
        <Text
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: '#ecfdf5',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#a7f3d0',
            color: '#065f46',
            fontSize: typography.fontSize.sm,
          }}
        >
          Your first subscription includes {payload.provider_subscription_promo.trial_months} months free. After the
          trial, billing continues at {formatSubscriptionPrice(999, 'USD', 'month')} or{' '}
          {formatSubscriptionPrice(9900, 'USD', 'year')}.
          {useAppleIap ? ' On iPhone, configure the 6-month free offer in App Store Connect.' : ''}
        </Text>
      ) : null}

      {useAppleIap ? (
        <>
          <Text style={{ marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Paid plans use the App Store. Put all provider plans in the same subscription group in App Store Connect so
            upgrades and downgrades work when you switch plans.
          </Text>
          <Pressable onPress={() => void restorePurchases()} disabled={restoring} style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>
              {restoring ? 'Restoring…' : 'Restore App Store purchases'}
            </Text>
          </Pressable>
        </>
      ) : null}

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
            {isAppleBilledSubscription(current) ? (
              <Pressable onPress={() => void openAppleSubscriptionManagement()} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>
                  Manage in App Store
                </Text>
              </Pressable>
            ) : current.cancel_at_period_end ? (
              <Pressable onPress={() => void resumeSub(current)} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Resume</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => cancelSub(current)} style={{ marginTop: spacing.md }}>
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
          plans.map((plan) => {
            const busy = subscribingUuid === plan.uuid;
            const isCurrentPlan = current?.plan?.uuid === plan.uuid;
            const canPurchase = isPaidBillingAvailable({
              priceCents: plan.price_cents,
              stripeReady: payload?.stripe_billing_configured,
              appleProductId: plan.apple_product_id,
              appleIapConfigured: payload?.apple_iap_configured,
            });
            const isPlanSwitch =
              !isCurrentPlan && Boolean(current) && plan.price_cents > 0 && canPurchase;

            return (
              <View
                key={plan.uuid}
                style={{
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isCurrentPlan ? colors.primary[300] : colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{plan.name}</Text>
                <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
                  {plan.price_cents <= 0
                    ? 'Free'
                    : formatSubscriptionPrice(plan.price_cents, plan.currency, plan.billing_cycle)}
                </Text>
                {isCurrentPlan ? (
                  <Text style={{ marginTop: spacing.md, color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
                    Current plan
                  </Text>
                ) : canPurchase && isPlanSwitch && useAppleIap ? (
                  <Pressable
                    onPress={() => void subscribeToPlan(plan, { switching: true })}
                    disabled={busy}
                    style={{
                      marginTop: spacing.md,
                      alignSelf: 'flex-start',
                      backgroundColor: colors.primary[600],
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      borderRadius: 10,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.text.inverse} />
                    ) : (
                      <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>
                        Switch to this plan with Apple
                      </Text>
                    )}
                  </Pressable>
                ) : canPurchase && isPlanSwitch && !useAppleIap ? (
                  <Pressable
                    onPress={async () => {
                      const res = await subApi.changeSubscriptionPlan(current!.uuid, plan.uuid);
                      Alert.alert('Plan change', res.message);
                      void load(false);
                    }}
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
                      Switch to this plan
                    </Text>
                  </Pressable>
                ) : canPurchase ? (
                  <Pressable
                    onPress={() => void subscribeToPlan(plan)}
                    disabled={busy}
                    style={{
                      marginTop: spacing.md,
                      alignSelf: 'flex-start',
                      backgroundColor: colors.primary[600],
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      borderRadius: 10,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.text.inverse} />
                    ) : (
                      <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>
                        {plan.price_cents <= 0 ? 'Activate' : useAppleIap ? 'Subscribe with Apple' : 'Subscribe'}
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <Text style={{ marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                    {useAppleIap
                      ? 'This plan is not available for In-App Purchase yet.'
                      : 'This plan is not available for checkout yet.'}
                  </Text>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}
