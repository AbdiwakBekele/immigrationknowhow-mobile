import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as dvApi from '../../api/dvLotteryApi';

export function DvLotteryScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<dvApi.DvLotteryContent | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await dvApi.getDvLottery();
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setContent(res.data.content);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen style={{ padding: spacing.xl }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </AppScreen>
    );
  }

  const title = typeof content?.title === 'string' ? content.title : 'DV Lottery';
  const shortDesc = typeof content?.short_description === 'string' ? content.short_description : '';
  const desc = typeof content?.description === 'string' ? content.description : '';
  const officialUrl = typeof content?.official_url === 'string' ? content.official_url : '';
  const ctaLabel = typeof content?.cta_label === 'string' ? content.cta_label : 'Official site';

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <ScrollView>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          {title}
        </Text>
        {!!shortDesc && (
          <Text style={{ marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.md }}>{shortDesc}</Text>
        )}
        {!!desc && <Text style={{ marginTop: spacing.lg, color: colors.text.primary }}>{desc}</Text>}
        {!!officialUrl && (
          <Pressable
            onPress={() => void Linking.openURL(officialUrl)}
            style={{
              marginTop: spacing['2xl'],
              backgroundColor: colors.primary[600],
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
              borderRadius: 12,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>{ctaLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </AppScreen>
  );
}
