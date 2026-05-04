import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { useDvLottery } from '../../context/DvLotteryContext';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const OFFICIAL_DEFAULT = 'https://dvprogram.state.gov/';

export function DvLotteryScreen() {
  const { content, loading, error, refresh } = useDvLottery();

  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh])
  );

  const c = useMemo(() => {
    const title = (content?.title ?? '').trim() || 'DV Lottery';
    const shortDescription =
      (content?.short_description ?? '').trim() ||
      'Official Diversity Visa information for providers and their clients.';
    const description =
      (content?.description ?? '').trim() ||
      'Always submit applications through the official U.S. Department of State portal.';
    const officialUrl = (content?.official_url ?? '').trim() || OFFICIAL_DEFAULT;
    const ctaLabel = (content?.cta_label ?? '').trim() || 'Open Official DV Lottery Website';
    const openFrom = content?.open_from != null && String(content.open_from).trim() !== '' ? String(content.open_from) : 'Not set';
    const openTo = content?.open_to != null && String(content.open_to).trim() !== '' ? String(content.open_to) : 'Not set';
    const isClosed = !!content?.is_closed;
    const isClosingSoon = !!content?.is_closing_soon;
    const statusMessage =
      content?.status_message != null && String(content.status_message).trim() !== ''
        ? String(content.status_message)
        : 'DV Lottery is currently open.';
    return {
      title,
      shortDescription,
      description,
      officialUrl,
      ctaLabel,
      openFrom,
      openTo,
      isClosed,
      isClosingSoon,
      statusMessage,
    };
  }, [content]);

  if (loading && !content) {
    return (
      <AppScreen variant="gradient" style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error && !content) {
    return (
      <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </AppScreen>
    );
  }

  const statusStyle = c.isClosed
    ? { borderColor: '#fecdd3', backgroundColor: '#fff1f2', textColor: '#9f1239' }
    : c.isClosingSoon
      ? { borderColor: '#fde68a', backgroundColor: '#fffbeb', textColor: '#92400e' }
      : { borderColor: colors.border, backgroundColor: colors.backgroundMuted, textColor: colors.text.secondary };

  return (
    <AppScreen variant="gradient" style={{ flex: 1, paddingHorizontal: screenPaddingX, paddingTop: spacing.md }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['3xl'] }}>
        <View
          style={{
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            Immigration resource
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            {c.title}
          </Text>
          <Text style={{ marginTop: spacing.sm, fontSize: typography.fontSize.md, color: colors.text.secondary, lineHeight: 22 }}>
            {c.shortDescription}
          </Text>
        </View>

        <View
          style={{
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
            Official Website
          </Text>
          <Text style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 20 }}>
            {c.description}
          </Text>
          <Text style={{ marginTop: spacing.md, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
            DV entry period:{' '}
            <Text style={{ fontWeight: typography.fontWeight.bold }}>{c.openFrom}</Text>
            {' — '}
            <Text style={{ fontWeight: typography.fontWeight.bold }}>{c.openTo}</Text>
          </Text>

          <Pressable
            onPress={() => void Linking.openURL(c.officialUrl)}
            style={{
              marginTop: spacing.lg,
              alignSelf: 'flex-start',
              backgroundColor: colors.primary[600],
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
              borderRadius: radii.lg,
            }}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
              {c.ctaLabel}
            </Text>
          </Pressable>
          <Text
            style={{
              marginTop: spacing.sm,
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
            }}
            numberOfLines={2}
          >
            {c.officialUrl}
          </Text>
        </View>

        <View
          style={{
            borderRadius: radii.xl,
            borderWidth: 1,
            padding: spacing.lg,
            backgroundColor: statusStyle.backgroundColor,
            borderColor: statusStyle.borderColor,
          }}
        >
          <Text style={{ fontSize: typography.fontSize.sm, color: statusStyle.textColor, lineHeight: 20 }}>{c.statusMessage}</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
