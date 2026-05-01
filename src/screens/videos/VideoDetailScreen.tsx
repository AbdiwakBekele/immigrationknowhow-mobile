import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { AppScreen } from '../../components/AppScreen';
import { BASE_URL } from '../../config/api';
import { getToken } from '../../services/tokenStorage';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as videosApi from '../../api/videosApi';
import type { VideosStackParamList } from './VideosStack';

export function VideoDetailScreen() {
  const route = useRoute<RouteProp<VideosStackParamList, 'VideoDetail'>>();
  const { slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [streamUri, setStreamUri] = useState<string | null>(null);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const res = await videosApi.getVideo(slug);
    setLoading(false);
    if (res.success) setPayload(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [slug])
  );

  const buy = async () => {
    const res = await videosApi.videoCheckout(slug);
    if (!res.success) {
      Alert.alert('Video', res.message);
      return;
    }
    const url = res.data?.checkout_url;
    if (url) await Linking.openURL(url);
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
        <Pressable onPress={() => void (payload?.requires_paid_access ? buy() : free())} style={{ marginTop: spacing.xl, backgroundColor: colors.primary[600], padding: spacing.md, borderRadius: 12 }}>
          <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>
            {payload?.requires_paid_access ? 'Purchase' : 'Unlock free'}
          </Text>
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
