import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type ScreenRoute = RouteProp<OnboardingStackParamList, 'StripeCheckout'>;
type ScreenNav = NativeStackNavigationProp<OnboardingStackParamList, 'StripeCheckout'>;

export function StripeCheckoutScreen() {
  const { refreshMe } = useAuth();
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<ScreenNav>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Checkout');

  function handleNavigationChange(event: WebViewNavigation) {
    const { url } = event;

    if (url.includes('checkout=success')) {
      void (async () => {
        await refreshMe();
        navigation.goBack();
      })();
      return false;
    }

    if (url.includes('checkout=cancelled')) {
      navigation.goBack();
      return false;
    }
  }

  function handleShouldStartLoad(event: WebViewNavigation): boolean {
    const { url } = event;

    if (url.includes('checkout=success') || url.includes('checkout=cancelled')) {
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

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loaderText}>Loading checkout…</Text>
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
