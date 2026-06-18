import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { AppScreen } from '../../components/AppScreen';
import { BASE_URL } from '../../config/api';
import { getToken } from '../../services/tokenStorage';
import { purchaseVideo } from '../../services/appleIapService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { PRICING_LABELS } from '../../config/pricingLabels';
import { isPaidBillingAvailable, shouldUseAppleIap } from '../../utils/platformPayments';
import * as videosApi from '../../api/videosApi';
import type { VideosStackParamList } from './VideosStack';

export function VideoDetailScreen() {
  const route = useRoute<RouteProp<VideosStackParamList, 'VideoDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<VideosStackParamList>>();
  const { slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [streamUri, setStreamUri] = useState<string | null>(null);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>({});

  const useAppleIap = shouldUseAppleIap();
  const appleProductId =
    typeof payload?.apple_product_id === 'string' && payload.apple_product_id.trim() !== ''
      ? payload.apple_product_id.trim()
      : null;
  const priceCents = Math.round(Number(payload?.video?.price ?? 0) * 100);
  const billingReady = isPaidBillingAvailable({
    priceCents: payload?.requires_paid_access ? priceCents : 0,
    appleProductId,
    stripeReady: payload?.stripe_configured,
  });

  const load = async () => {
    setLoading(true);
    const res = await videosApi.getVideo(slug);
    setLoading(false);
    if (res.success) setPayload(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [slug]),
  );

  const buy = async () => {
    if (!billingReady && payload?.requires_paid_access) {
      Alert.alert('Video', PRICING_LABELS.itemUnavailable);
      return;
    }

    setPurchasing(true);
    try {
      if (useAppleIap) {
        if (!appleProductId) {
          Alert.alert('Video', PRICING_LABELS.itemUnavailable);
          return;
        }
        await purchaseVideo(slug, appleProductId, priceCents);
        await load();
        Alert.alert('Video', 'Thank you! You can now play this video.');
        return;
      }

      const res = await videosApi.videoCheckout(slug);
      if (!res.success) {
        Alert.alert('Video', res.message);
        return;
      }
      const url = res.data?.checkout_url;
      if (url) {
        navigation.navigate('StripeCheckout', { checkoutUrl: url, variant: 'default', videoSlug: slug });
      }
    } catch (e) {
      Alert.alert('Video', e instanceof Error ? e.message : 'Purchase could not be completed.');
    } finally {
      setPurchasing(false);
    }
  };

  const free = async () => {
    const res = await videosApi.videoGrantFree(slug);
    if (!res.success) Alert.alert('Video', res.message);
    else void load();
  };

  const playUpload = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Video', 'Not signed in.');
      return;
    }
    const uri = `${BASE_URL}/api/mobile/videos/${encodeURIComponent(slug)}/stream`;
    setStreamHeaders({ Authorization: `Bearer ${token}` });
    setStreamUri(uri);
  };

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const video = payload?.video;
  const hasAccess = payload?.has_access;
  const streamPath = payload?.stream_path as string | null;

  if (streamUri) {
    return (
      <AppScreen style={{ padding: 0, flex: 1 }}>
        <Pressable onPress={() => setStreamUri(null)} style={{ padding: spacing.md }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>← Close</Text>
        </Pressable>
        <WebView source={{ uri: streamUri, headers: streamHeaders }} style={{ flex: 1 }} />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{video?.title}</Text>
      <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>{video?.description}</Text>
      {!hasAccess && (
        <Pressable
          onPress={() => void (payload?.requires_paid_access ? buy() : free())}
          disabled={purchasing || (payload?.requires_paid_access && !billingReady)}
          style={{
            marginTop: spacing.xl,
            backgroundColor: colors.primary[600],
            padding: spacing.md,
            borderRadius: 12,
            opacity: purchasing || (payload?.requires_paid_access && !billingReady) ? 0.7 : 1,
          }}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>
              {payload?.requires_paid_access ? PRICING_LABELS.purchase : PRICING_LABELS.unlockFree}
            </Text>
          )}
        </Pressable>
      )}
      {hasAccess && streamPath && (
        <Pressable onPress={() => void playUpload()} style={{ marginTop: spacing.xl, backgroundColor: colors.primary[600], padding: spacing.md, borderRadius: 12 }}>
          <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Play</Text>
        </Pressable>
      )}
    </AppScreen>
  );
}
