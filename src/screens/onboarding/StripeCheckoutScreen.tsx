import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import * as adsApi from '../../api/adsApi';
import * as aiApi from '../../api/aiAssistantApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export type StripeCheckoutParams = {
  checkoutUrl: string;
  /** Runs provider onboarding auth refresh after success. */
  variant?: 'onboarding' | 'default' | 'aiAssistant';
  /** Required for ad checkout — confirms payment via API when WebView intercepts the return URL. */
  adUuid?: string;
  /** Fallback Stripe session id when the return URL does not include session_id (AI Assistant). */
  checkoutSessionId?: string;
};

type StripeCheckoutParamList = {
  StripeCheckout: StripeCheckoutParams;
};

type ScreenRoute = RouteProp<StripeCheckoutParamList, 'StripeCheckout'>;
type ScreenNav = NativeStackNavigationProp<StripeCheckoutParamList, 'StripeCheckout'>;

function extractSessionId(url: string): string | null {
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

function isCheckoutSuccess(url: string): boolean {
  if (url.includes('checkout=success')) {
    return true;
  }
  if (url.includes('/mobile/ai-assistant/checkout-return') && url.includes('session_id=')) {
    return true;
  }
  return url.includes('purchase/return') && url.includes('session_id=');
}

function isCheckoutCancelled(url: string): boolean {
  if (url.includes('checkout=cancelled')) {
    return true;
  }
  if (url.includes('/mobile/ai-assistant/checkout-return') && url.includes('checkout=cancelled')) {
    return true;
  }
  return url.includes('purchase/cancel');
}

async function confirmAiAssistantWithRetry(
  sessionId: string,
  fallbackSessionId?: string,
): Promise<{ ok: true; state: aiApi.AiAssistantState } | { ok: false; message: string }> {
  const ids = [sessionId, fallbackSessionId].filter((id): id is string => Boolean(id && id.trim()));
  const uniqueIds = [...new Set(ids)];

  for (let attempt = 0; attempt < 5; attempt++) {
    for (const id of uniqueIds) {
      const res = await aiApi.confirmAiAssistantCheckout(id);
      if (res.success && res.data.state.is_addon_active) {
        return { ok: true, state: res.data.state };
      }
      if (res.success && !res.data.state.is_addon_active) {
        continue;
      }
      if (!res.success && attempt === 4) {
        return { ok: false, message: res.message };
      }
    }
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return {
    ok: false,
    message: 'Payment was received but your subscription is not active yet. Please try again in a moment.',
  };
}

export function StripeCheckoutScreen() {
  const { refreshMe, setActiveRole } = useAuth();
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<ScreenNav>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const handledRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState('Checkout');
  const variant = route.params.variant ?? 'onboarding';
  const adUuid = route.params.adUuid;
  const checkoutSessionId = route.params.checkoutSessionId;

  async function completeCheckoutSuccess(url: string) {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;
    setConfirming(true);

    try {
      if (adUuid) {
        const sessionId = extractSessionId(url);
        if (!sessionId) {
          Alert.alert('Payment', 'Missing payment session. Please contact support if you were charged.');
          handledRef.current = false;
          return;
        }
        const res = await adsApi.confirmAdCheckout(adUuid, sessionId);
        if (!res.success) {
          Alert.alert('Payment', res.message);
          handledRef.current = false;
          return;
        }
        if (res.message) {
          Alert.alert('Payment', res.message);
        }
      } else if (variant === 'onboarding') {
        await refreshMe();
        await setActiveRole('provider');
      } else if (variant === 'aiAssistant') {
        const sessionId = extractSessionId(url) ?? checkoutSessionId ?? null;
        if (!sessionId) {
          Alert.alert('Subscription', 'Missing payment session. Please contact support if you were charged.');
          handledRef.current = false;
          return;
        }
        const confirmed = await confirmAiAssistantWithRetry(sessionId, checkoutSessionId);
        if (!confirmed.ok) {
          Alert.alert('Subscription', confirmed.message);
          handledRef.current = false;
          return;
        }
      }

      navigation.goBack();
    } finally {
      setConfirming(false);
    }
  }

  function handleNavigationChange(event: WebViewNavigation) {
    const { url } = event;

    if (isCheckoutSuccess(url)) {
      void completeCheckoutSuccess(url);
      return;
    }

    if (isCheckoutCancelled(url)) {
      if (!handledRef.current) {
        handledRef.current = true;
        navigation.goBack();
      }
    }
  }

  function handleShouldStartLoad(event: WebViewNavigation): boolean {
    const { url } = event;

    if (isCheckoutSuccess(url) || isCheckoutCancelled(url)) {
      handleNavigationChange(event);
      return false;
    }

    return true;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={confirming}
          style={styles.backButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel checkout"
        >
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {(loading || confirming) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loaderText}>{confirming ? 'Confirming payment…' : 'Loading checkout…'}</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: route.params.checkoutUrl }}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(event) => {
          setTitle(event.title || 'Checkout');
          handleNavigationChange(event);
        }}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        startInLoadingState={false}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 36,
  },
  webView: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loaderText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
