import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { AppScreen } from '../../components/AppScreen';
import { PaymentCtaButton } from '../../components/pricing/PaymentCtaButton';
import { PaidFeatureBadge } from '../../components/pricing/PaidFeatureBadge';
import { SubscriptionLegalFooter } from '../../components/pricing/SubscriptionLegalFooter';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as subApi from '../../api/providerSubscriptionsApi';
import { alertPaymentsUnavailable, resolveSafeStripeCheckoutUrl } from '../../api/paymentApi';
import { purchaseProviderSubscription, restoreApplePurchasesOnDevice } from '../../services/appleIapService';
import { mapAppleIapUserMessage } from '../../utils/appleIapErrors';
import { isPaidBillingAvailable, shouldUseAppleIap } from '../../utils/platformPayments';
import { formatSubscriptionPrice } from '../../utils/money';
import { isActiveProviderSubscription, providerRequiresSubscription } from '../../utils/providerSubscription';
import { PRICING_LABELS } from '../../config/pricingLabels';

function subscriptionDurationLabel(billingCycle?: string | null): string {
  const cycle = (billingCycle ?? 'month').toLowerCase();
  if (cycle === 'year' || cycle === 'yearly' || cycle === 'annual') {
    return '1 year';
  }
  return '1 month';
}

function extractCheckoutSessionId(url: string): string | null {
  const match = url.match(/[?&]session_id=([^&]+)/);
  if (!match?.[1]) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function isProviderCheckoutSuccess(url: string): boolean {
  return url.includes('mobile/provider-subscription/checkout-return') && url.includes('session_id=');
}

function isProviderCheckoutCancelled(url: string): boolean {
  return url.includes('checkout=cancelled');
}

type Props = {
  requiredMode?: boolean;
  onSubscriptionActive?: () => void;
};

export function ProviderSubscriptionsScreen({ requiredMode = false, onSubscriptionActive }: Props) {
  const insets = useSafeAreaInsets();
  const checkoutHandledRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribingUuid, setSubscribingUuid] = useState<string | null>(null);
  const [activatingUuid, setActivatingUuid] = useState<string | null>(null);
  const [changingPlanUuid, setChangingPlanUuid] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<subApi.SubscriptionsPayload | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutWebLoading, setCheckoutWebLoading] = useState(true);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);

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

  const subscribeToPlan = async (plan: subApi.SubscriptionPlanRow, options?: { switching?: boolean }) => {
    if (plan.price_cents <= 0) {
      setActivatingUuid(plan.uuid);
      setProcessingMessage(PRICING_LABELS.processing);
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

    if (!useAppleIap && options?.switching && current) {
      setChangingPlanUuid(plan.uuid);
      setProcessingMessage(PRICING_LABELS.processing);
      try {
        const res = await subApi.changeSubscriptionPlan(current.uuid, plan.uuid);
        Alert.alert('Plan change', res.message);
        await load(false);
      } finally {
        setChangingPlanUuid(null);
        setProcessingMessage(null);
      }
      return;
    }

    if (useAppleIap) {
      const appleProductId = plan.apple_product_id?.trim();
      if (!appleProductId) {
        Alert.alert('Subscription', PRICING_LABELS.planUnavailable);
        return;
      }

      setSubscribingUuid(plan.uuid);
      setProcessingMessage(PRICING_LABELS.processing);
      try {
        await purchaseProviderSubscription(plan.uuid, appleProductId, plan.price_cents);
        setProcessingMessage(PRICING_LABELS.processing);
        const refreshed = await subApi.getProviderSubscriptions();
        if (refreshed.success) {
          const next = refreshed.data.subscriptions;
          setPayload(next);
          if (!providerRequiresSubscription(next)) {
            onSubscriptionActive?.();
          }
        }
        const active = refreshed.success && isActiveProviderSubscription(refreshed.data.subscriptions.current_subscription);
        if (!active) {
          Alert.alert(
            'Subscription',
            'Purchase completed, but we could not refresh your access. Please tap Restore Purchases or try again.',
          );
          return;
        }
        Alert.alert(
          'Subscription',
          options?.switching
            ? 'Your plan change was submitted. It may take a moment to update.'
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
    setProcessingMessage(PRICING_LABELS.processing);
    try {
      const res = await subApi.startSubscriptionCheckout(plan.uuid);
      if (!res.success) {
        Alert.alert('Checkout', res.message);
        return;
      }
      const url = res.data.checkout_url;
      const safeUrl = resolveSafeStripeCheckoutUrl(url);
      if (safeUrl) {
        checkoutHandledRef.current = false;
        setCheckoutWebLoading(true);
        setCheckoutUrl(safeUrl);
      } else if (url) {
        alertPaymentsUnavailable();
      }
    } finally {
      setSubscribingUuid(null);
      setProcessingMessage(null);
    }
  };

  const completeProviderCheckout = async (url: string) => {
    if (checkoutHandledRef.current) {
      return;
    }
    checkoutHandledRef.current = true;
    const sessionId = extractCheckoutSessionId(url);
    if (!sessionId) {
      checkoutHandledRef.current = false;
      Alert.alert('Subscription', 'Missing payment session. Please contact support if you were charged.');
      return;
    }

    setConfirmingCheckout(true);
    try {
      const res = await subApi.confirmSubscriptionCheckout(sessionId);
      if (!res.success) {
        checkoutHandledRef.current = false;
        Alert.alert('Subscription', res.message);
        return;
      }
      setCheckoutUrl(null);
      await load(false);
      const refreshed = await subApi.getProviderSubscriptions();
      if (refreshed.success) {
        setPayload(refreshed.data.subscriptions);
        if (!providerRequiresSubscription(refreshed.data.subscriptions)) {
          onSubscriptionActive?.();
        }
      }
      Alert.alert('Subscription', 'Your provider plan is now active.');
    } finally {
      setConfirmingCheckout(false);
    }
  };

  const handleCheckoutNavigation = (event: WebViewNavigation) => {
    const { url } = event;
    if (isProviderCheckoutSuccess(url)) {
      void completeProviderCheckout(url);
      return false;
    }
    if (isProviderCheckoutCancelled(url)) {
      setCheckoutUrl(null);
      return false;
    }
    return true;
  };

  const current = payload?.current_subscription ?? null;
  const pending = payload?.pending_subscription ?? null;
  const plans = payload?.plans ?? [];

  const restorePurchases = async () => {
    if (restoring || Boolean(processingMessage)) return;

    setRestoring(true);
    setProcessingMessage(PRICING_LABELS.processing);
    try {
      if (useAppleIap) {
        await restoreApplePurchasesOnDevice();
      }
      const refreshed = await subApi.getProviderSubscriptions();
      if (refreshed.success) {
        setPayload(refreshed.data.subscriptions);
        if (!providerRequiresSubscription(refreshed.data.subscriptions)) {
          onSubscriptionActive?.();
        }
      }
      const activeAfterRestore =
        refreshed.success && isActiveProviderSubscription(refreshed.data.subscriptions.current_subscription);
      if (!activeAfterRestore) {
        Alert.alert('Restore Purchases', 'No active provider subscription was found to restore.');
      } else {
        Alert.alert('Restore Purchases', 'Your provider subscription has been restored.');
      }
    } catch (e) {
      const message = mapAppleIapUserMessage(e, 'provider-restore');
      if (message) {
        Alert.alert('Restore Purchases', message);
      }
    } finally {
      setRestoring(false);
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
            </View>
          </View>
        ) : (
          <Text style={styles.pageTitle}>Plan & subscription</Text>
        )}

        <View style={styles.paywallIntro}>
          <PaidFeatureBadge label="Requires subscription" />
        </View>

        {pending && !isActiveProviderSubscription(current) ? (
          <View style={styles.pendingCard}>
            <Ionicons name="time-outline" size={20} color="#92400e" />
            <Text style={styles.pendingText}>
              {pending.plan?.name ?? 'Your plan'} is waiting for payment. Complete your purchase below.
            </Text>
          </View>
        ) : null}

        {current ? (
          <View style={styles.currentCard}>
            <Text style={styles.sectionLabel}>Current plan</Text>
            <Text style={styles.planTitle}>{current.plan?.name ?? 'Plan'}</Text>
            <Text style={styles.mutedText}>Status: {current.status}</Text>
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
                    {plan.price_cents > 0 ? (
                      <Text style={styles.planDuration}>
                        Duration: {subscriptionDurationLabel(plan.billing_cycle)}
                      </Text>
                    ) : null}
                  </View>
                  {isCurrentPlan ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  ) : null}
                </View>

                {isCurrentPlan ? null : canPurchase && isPlanSwitch ? (
                  <PaymentCtaButton
                    label={PRICING_LABELS.switchPlan}
                    onPress={() => void subscribeToPlan(plan, { switching: true })}
                    disabled={busy || Boolean(processingMessage)}
                    loading={busy}
                    loadingLabel={PRICING_LABELS.processing}
                    style={styles.planCta}
                  />
                ) : canPurchase ? (
                  <PaymentCtaButton
                    label={plan.price_cents <= 0 ? PRICING_LABELS.activateFreePlan : PRICING_LABELS.subscribe}
                    onPress={() => void subscribeToPlan(plan)}
                    disabled={busy || Boolean(processingMessage)}
                    loading={busy}
                    loadingLabel={PRICING_LABELS.processing}
                    style={styles.planCta}
                  />
                ) : (
                  <Text style={styles.unavailableText}>{PRICING_LABELS.planUnavailable}</Text>
                )}
              </View>
            );
          })
        )}

        <SubscriptionLegalFooter onRestore={() => void restorePurchases()} restoring={restoring} />
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

      <Modal visible={Boolean(checkoutUrl)} animationType="slide" onRequestClose={() => setCheckoutUrl(null)}>
        <View style={[styles.checkoutContainer, { paddingTop: insets.top }]}>
          <View style={styles.checkoutHeader}>
            <Pressable onPress={() => setCheckoutUrl(null)} style={styles.checkoutClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.checkoutTitle} numberOfLines={1}>
              Subscription checkout
            </Text>
            <View style={styles.checkoutClose} />
          </View>
          {(checkoutWebLoading || confirmingCheckout) && (
            <View style={styles.checkoutLoader}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.checkoutLoaderText}>
                {confirmingCheckout ? PRICING_LABELS.confirmingPayment : PRICING_LABELS.loadingCheckout}
              </Text>
            </View>
          )}
          {checkoutUrl ? (
            <WebView
              source={{ uri: checkoutUrl }}
              onLoadStart={() => setCheckoutWebLoading(true)}
              onLoadEnd={() => setCheckoutWebLoading(false)}
              onShouldStartLoadWithRequest={handleCheckoutNavigation}
              onNavigationStateChange={handleCheckoutNavigation}
              style={styles.checkoutWebView}
            />
          ) : null}
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
  paywallIntro: {
    alignItems: 'center',
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
  planDuration: {
    marginTop: 2,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
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
  checkoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkoutClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  checkoutWebView: {
    flex: 1,
  },
  checkoutLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 2,
    gap: spacing.md,
  },
  checkoutLoaderText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
