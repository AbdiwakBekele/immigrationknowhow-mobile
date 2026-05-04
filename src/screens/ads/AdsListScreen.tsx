import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as adsApi from '../../api/adsApi';
import type { AdsStackParamList } from './AdsStack';

export function AdsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const [res, ares] = await Promise.all([adsApi.listAds(), adsApi.getAdsAnalytics()]);
    setLoading(false);
    if (!res.success) return;
    setAds(res.data?.ads ?? []);
    if (ares.success) setAnalytics(ares.data ?? null);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const pay = async (uuid: string) => {
    const res = await adsApi.checkoutAd(uuid);
    if (!res.success) Alert.alert('Ads', res.message);
    else if (res.data?.checkout_url) await Linking.openURL(res.data.checkout_url);
  };

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <View style={{ marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 14 }}>
        <Text style={{ color: colors.text.secondary }}>
          Views: {analytics?.summary?.views ?? '—'} · Clicks: {analytics?.summary?.clicks ?? '—'} · CTR: {analytics?.summary?.ctr ?? '—'}%
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : (
        <FlatList
          style={{ marginTop: spacing.xl }}
          data={ads}
          keyExtractor={(a) => a.uuid}
          ListEmptyComponent={<Text style={{ color: colors.text.secondary }}>No ads yet.</Text>}
          ListFooterComponent={
            <Pressable
              onPress={() => navigation.navigate('AdsCreate')}
              style={{
                marginTop: spacing.lg,
                backgroundColor: colors.primary[600],
                padding: spacing.md,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Create Ad</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <View style={{ padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>{item.title}</Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.muted }}>{item.status}</Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
                Views: {item.analytics?.views ?? '—'} · Clicks: {item.analytics?.clicks ?? '—'} · CTR: {item.analytics?.ctr ?? '—'}%
              </Text>
              {item.status === 'pending_payment' && (
                <Pressable onPress={() => void pay(item.uuid)} style={{ marginTop: spacing.sm }}>
                  <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Pay</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </AppScreen>
  );
}
