import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { PaymentCtaButton } from '../../components/pricing/PaymentCtaButton';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as subApi from '../../api/providerSubscriptionsApi';
import { purchaseProviderSubscription, restoreApplePurchasesOnDevice } from '../../services/appleIapService';
import { mapAppleIapUserMessage } from '../../utils/appleIapErrors';
import { isPaidBillingAvailable, openAppleSubscriptionManagement, shouldUseAppleIap } from '../../utils/platformPayments';
import { formatSubscriptionPrice } from '../../utils/money';
import {
  isActiveProviderSubscription,
  isAnnualBillingCycle,
  isMonthlyBillingCycle,
  providerRequiresSubscription,
} from '../../utils/providerSubscription';

function isAppleBilledSubscription(sub: subApi.ProviderSubscriptionRow | null | undefined): boolean {
  if (!sub) return false;
  return Boolean(sub.apple_original_transaction_id?.trim()) && !sub.stripe_subscription_id?.trim();
}

type Props = {
  requiredMode?: boolean;
  onSubscriptionActive?: () => void;
};

export function ProviderSubscriptionsScreen({ requiredMode = false, onSubscriptionActive }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribingUuid, setSubscribingUuid] = useState<string | null>(null);
  const [activatingUuid, setActivatingUuid] = useState<string | null>(null);
  const [changingPlanUuid, setChangingPlanUuid] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
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
    const next = res.data.subscriptions;
    setPayload(next);
    if (!providerRequiresSubscription(next)) {
      onSubscriptionActive?.();
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, []),
  );

  const promoPriceLine = useMemo(() => {
    const plans = payload?.plans ?? [];
    const monthly = plans.find((plan) => plan.price_cents > 0 && isMonthlyBillingCycle(plan.billing_cycle));
    const yearly = plans.find((plan) => plan.price_cents > 0 && isAnnualBillingCycle(plan.billing_cycle));
    if (!monthly && !yearly) return null;
    if (monthly && yearly) {
      return `${formatSubscriptionPrice(monthly.price_cents, monthly.currency, monthly.billing_cycle)} or ${formatSubscriptionPrice(yearly.price_cents, yearly.currency, yearly.billing_cycle)}`;
    }
    const only = monthly ?? yearly!;
    return formatSubscriptionPrice(only.price_cents, only.currency, only.billing_cycle);
  }, [payload?.plans]);

  const subscribeToPlan = async (plan: subApi.SubscriptionPlanRow, options?: { switching?: boolean }) => {
    if (plan.price_cents <= 0) {
      setActivatingUuid(plan.uuid);
      setProcessingMessage('Activating free plan…');
      try {
        const res = await subApi.startSubscriptionCheckout(plan.uuid);
        if (!res.success) {
          Alert.alert('Subscription', res.message);
          return;
        }
        await load(false);
        Alert.alert('Subscription', res.message || 'Your free plan is now active.');
      } finally {
        setActivatingUuid(null);
        setProcessingMessage(null);
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
      setProcessingMessage(
        options?.switching
          ? 'Switching plan with the App Store…'
          : 'Processing subscription with the App Store…',
      );
      try {
        await purchaseProviderSubscription(plan.uuid, appleProductId);
        setProcessingMessage('Verifying subscription…');
        await load(false);
        Alert.alert(
          'Subscription',
          options?.switching
            ? 'Your plan change was submitted to the App Store. It may take a moment to update.'
            : 'Your provider plan is now active.',
        );
      } catch (e) {
        const message = mapAppleIapUserMessage(e, 'provider-subscription');
        if (message) {
          Alert.alert('Subscription', message);
        }
      } finally {
        setSubscribingUuid(null);
        setProcessingMessage(null);
      }
      return;
    }

    setSubscribingUuid(plan.uuid);
    setProcessingMessage('Opening checkout…');
    try {
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
    } finally {
      setSubscribingUuid(null);
      setProcessingMessage(null);
    }
  };

  const restorePurchases = async () => {
    setRestoring(true);
    setProcessingMessage('Restoring App Store purchases…');
    try {
      const result = await restoreApplePurchasesOnDevice();
      setProcessingMessage('Updating subscription status…');
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
      const message = mapAppleIapUserMessage(e, 'provider-restore');
      Alert.alert('Restore purchases', message ?? 'Could not restore purchases.');
    } finally {
      setRestoring(false);
      setProcessingMessage(null);
    }
  };

  const current = payload?.current_subscription ?? null;
  const pending = payload?.pending_subscription ?? null;
  const plans = payload?.plans ?? [];
  const billingConfigured =
    payload?.subscription_billing_configured ??
    (payload?.stripe_billing_configured || (useAppleIap && payload?.apple_iap_configured));

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

  const changeStripePlan = async (plan: subApi.SubscriptionPlanRow) => {
    if (!current) return;
    setChangingPlanUuid(plan.uuid);
    setProcessingMessage('Updating plan…');
    try {
      const res = await subApi.changeSubscriptionPlan(current.uuid, plan.uuid);
      Alert.alert('Plan change', res.message);
      await load(false);
    } finally {
      setChangingPlanUuid(null);
      setProcessingMessage(null);
    }
  };

  if (loading && !payload) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading subscription plans…</Text>
      </AppScreen>
    );
  }

  if (error && !payload) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => void load(false)} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" style={styles.screen} constrained>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {requiredMode ? (
          <View style={styles.requiredBanner}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.primary[700]} />
            <View style={styles.requiredCopy}>
              <Text style={styles.requiredTitle}>Subscription required</Text>
              <Text style={styles.requiredBody}>
                Choose a monthly or annual plan to access your provider dashboard.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.pageTitle}>Plan & subscription</Text>
        )}

        {!billingConfigured ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {useAppleIap
                ? 'In-App Purchase billing is not fully configured on the server yet.'
                : 'Online billing is not configured on the server.'}
            </Text>
          </View>
        ) : null}

        {pending && !isActiveProviderSubscription(current) ? (
          <View style={styles.pendingCard}>
            <Ionicons name="time-outline" size={20} color="#92400e" />
            <Text style={styles.pendingText}>
              {pending.plan?.name ?? 'Your plan'} is waiting for payment. Complete purchase below or restore purchases.
            </Text>
          </View>
        ) : null}

        {payload?.provider_subscription_promo?.trial_eligible &&
        (payload.provider_subscription_promo.trial_months ?? 0) > 0 ? (
          <View style={styles.promoCard}>
            <Text style={styles.promoText}>
              Your first subscription includes {payload.provider_subscription_promo.trial_months} months free.
              {promoPriceLine ? ` After the trial, billing continues at ${promoPriceLine}.` : ''}
              {useAppleIap ? ' Configure the introductory offer in App Store Connect.' : ''}
            </Text>
          </View>
        ) : null}

        {useAppleIap ? (
          <View style={styles.appleNote}>
            <Text style={styles.mutedText}>
              Paid plans use the App Store. Put all provider plans in the same subscription group so monthly and annual
              upgrades work when you switch plans.
            </Text>
            <Pressable onPress={() => void restorePurchases()} disabled={restoring || Boolean(processingMessage)}>
              <Text style={[styles.linkText, (restoring || processingMessage) && styles.linkDisabled]}>
                {restoring ? 'Restoring purchases…' : 'Restore App Store purchases'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {current ? (
          <View style={styles.currentCard}>
            <Text style={styles.sectionLabel}>Current plan</Text>
            <Text style={styles.planTitle}>{current.plan?.name ?? 'Plan'}</Text>
            <Text style={styles.mutedText}>Status: {current.status}</Text>
            {isAppleBilledSubscription(current) ? (
              <Pressable onPress={() => void openAppleSubscriptionManagement()} style={styles.inlineAction}>
                <Text style={styles.linkText}>Manage in App Store</Text>
              </Pressable>
            ) : current.cancel_at_period_end ? (
              <Pressable onPress={() => void resumeSub(current)} style={styles.inlineAction}>
                <Text style={styles.linkText}>Resume subscription</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => cancelSub(current)} style={styles.inlineAction}>
                <Text style={styles.dangerText}>Cancel at period end</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Available plans</Text>
        {plans.length === 0 ? (
          <Text style={styles.mutedText}>No plans available for your service types.</Text>
        ) : (
          plans.map((plan) => {
            const busy =
              subscribingUuid === plan.uuid || activatingUuid === plan.uuid || changingPlanUuid === plan.uuid;
            const isCurrentPlan = current?.plan?.uuid === plan.uuid;
            const canPurchase = isPaidBillingAvailable({
              priceCents: plan.price_cents,
              stripeReady: payload?.stripe_billing_configured,
              appleProductId: plan.apple_product_id,
              appleIapConfigured: payload?.apple_iap_configured,
            });
            const isPlanSwitch = !isCurrentPlan && Boolean(current) && plan.price_cents > 0 && canPurchase;
            const priceLabel =
              plan.price_cents <= 0
                ? 'Free'
                : formatSubscriptionPrice(plan.price_cents, plan.currency, plan.billing_cycle);

            return (
              <View key={plan.uuid} style={[styles.planCard, isCurrentPlan && styles.planCardCurrent]}>
                <View style={styles.planHeader}>
                  <View style={styles.planCopy}>
                    <Text style={styles.planTitle}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{priceLabel}</Text>
                  </View>
                  {isCurrentPlan ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  ) : null}
                </View>

                {isCurrentPlan ? null : canPurchase && isPlanSwitch && useAppleIap ? (
                  <PaymentCtaButton
                    label="Switch plan"
                    onPress={() => void subscribeToPlan(plan, { switching: true })}
                    disabled={busy || Boolean(processingMessage)}
                    loading={busy}
                    loadingLabel="Switching plan…"
                    style={styles.planCta}
                  />
                ) : canPurchase && isPlanSwitch && !useAppleIap ? (
                  <PaymentCtaButton
                    label="Switch plan"
                    onPress={() => void changeStripePlan(plan)}
                    disabled={busy || Boolean(processingMessage)}
                    loading={busy}
                    loadingLabel="Switching plan…"
                    style={styles.planCta}
                  />
                ) : canPurchase ? (
                  <PaymentCtaButton
                    label={plan.price_cents <= 0 ? 'Activate free plan' : 'Subscribe'}
                    onPress={() => void subscribeToPlan(plan)}
                    disabled={busy || Boolean(processingMessage)}
                    loading={busy}
                    loadingLabel={plan.price_cents <= 0 ? 'Activating…' : 'Processing…'}
                    style={styles.planCta}
                  />
                ) : (
                  <Text style={styles.unavailableText}>
                    {useAppleIap
                      ? 'This plan is not available for In-App Purchase yet.'
                      : 'This plan is not available for checkout yet.'}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={Boolean(processingMessage)} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.overlayText}>{processingMessage}</Text>
            <Text style={styles.overlayHint}>Please wait. Do not close the app.</Text>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  pageTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  requiredBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  requiredCopy: {
    flex: 1,
  },
  requiredTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  requiredBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff7ed',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    color: '#9a3412',
    fontSize: typography.fontSize.sm,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#fffbeb',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pendingText: {
    flex: 1,
    color: '#92400e',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  promoCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  promoText: {
    color: '#065f46',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  appleNote: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planCardCurrent: {
    borderColor: colors.primary[300],
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planCopy: {
    flex: 1,
  },
  planTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  planPrice: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  currentBadge: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.xs,
  },
  planCta: {
    marginTop: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  unavailableText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  linkText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  linkDisabled: {
    opacity: 0.6,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  inlineAction: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  retryText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  overlayText: {
    textAlign: 'center',
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
  overlayHint: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
