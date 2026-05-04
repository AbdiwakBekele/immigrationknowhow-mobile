import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as libraryApi from '../../api/libraryApi';
import type { LibraryStackParamList } from './LibraryStack';

export function LibraryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LibraryStackParamList, 'LibraryDetail'>>();
  const { slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.getLibraryItem(slug);
    setLoading(false);
    if (res.success) setData(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [slug])
  );

  useLayoutEffect(() => {
    const it = data?.item;
    const t = typeof it?.title === 'string' && it.title.trim() !== '' ? it.title : slug;
    navigation.setOptions({ title: t });
  }, [navigation, data, slug]);

  const pay = async () => {
    const res = await libraryApi.libraryStripeCheckout(slug);
    if (!res.success) {
      Alert.alert('Checkout', res.message);
      return;
    }
    const url = res.data?.checkout_url;
    if (url) await Linking.openURL(url);
  };

  const free = async () => {
    const res = await libraryApi.libraryGrantFree(slug);
    if (!res.success) Alert.alert('Library', res.message);
    else void load();
  };

  const openReader = async () => {
    const res = await libraryApi.getLibraryStreamUrls(slug);
    if (!res.success || !res.data?.stream_urls?.pdf) {
      Alert.alert('Read', res.success ? 'No PDF URL available.' : res.message);
      return;
    }
    setPdfUrl(res.data.stream_urls.pdf);
  };

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const item = data?.item;
  const hasAccess = !!data?.has_access;

  if (pdfUrl && item?.type === 'ebook') {
    return (
      <AppScreen style={{ padding: 0, flex: 1 }}>
        <Pressable onPress={() => setPdfUrl(null)} style={{ padding: spacing.md, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>← Close reader</Text>
        </Pressable>
        <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <ScrollView>
        <Text style={{ color: colors.text.secondary }}>{item?.description}</Text>
        {!hasAccess && (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            {data?.requires_paid_access ? (
              <Pressable onPress={() => void pay()} style={{ backgroundColor: colors.primary[600], padding: spacing.md, borderRadius: 12 }}>
                <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Buy with Stripe</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => void free()} style={{ backgroundColor: colors.primary[600], padding: spacing.md, borderRadius: 12 }}>
                <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Add free title</Text>
              </Pressable>
            )}
          </View>
        )}
        {hasAccess && item?.type === 'ebook' && (
          <Pressable onPress={() => void openReader()} style={{ marginTop: spacing.xl, backgroundColor: colors.primary[600], padding: spacing.md, borderRadius: 12 }}>
            <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Read</Text>
          </Pressable>
        )}
      </ScrollView>
    </AppScreen>
  );
}
