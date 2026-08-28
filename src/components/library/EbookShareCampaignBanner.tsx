import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const heroGradient = ['#059669', '#0d9488', '#0e7490'] as const;

type Props = {
  campaign: any;
  onPress: () => void;
};

export function EbookShareCampaignBanner({ campaign, onPress }: Props) {
  const progressPercent = useMemo(() => {
    const required = Number(campaign?.required_shares || 5);
    const confirmed = Number(campaign?.confirmed_shares || 0);
    if (required <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((confirmed / required) * 100));
  }, [campaign]);

  const title = campaign?.rewarded && campaign?.coupon_code
    ? 'Your free ebook coupon is ready'
    : 'Share 5 ebooks, get 1 free';

  const subtitle = campaign?.rewarded && campaign?.coupon_code
    ? `Use code ${campaign.coupon_code} on any paid ebook.`
    : `${campaign?.confirmed_shares || 0} of ${campaign?.required_shares || 5} shares complete — share on Facebook or X from any ebook page.`;

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <LinearGradient colors={[...heroGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="gift-outline" size={22} color="#fff" />
          </View>

          <View style={styles.content}>
            <View style={styles.badgeRow}>
              <Ionicons name="sparkles-outline" size={12} color="rgba(236,253,245,0.95)" />
              <Text style={styles.badgeText}>Share & Earn</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  gradient: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  glowOne: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glowTwo: {
    position: 'absolute',
    bottom: -20,
    left: 16,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(165,243,252,0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(236,253,245,0.92)',
  },
  title: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: 'rgba(236,253,245,0.88)',
  },
  track: {
    marginTop: spacing.sm,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
});
