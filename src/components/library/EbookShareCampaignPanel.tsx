import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { AppImage } from '../AppImage';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const heroGradient = ['#059669', '#0d9488', '#0e7490'] as const;

const HOW_TO_STEPS = [
  'Open any ebook detail page in the library.',
  'Tap Share for free book on Facebook or X.',
  'Complete five different ebook shares to unlock your coupon.',
];

const STEP_ICONS = ['book-outline', 'share-social-outline', 'gift-outline'] as const;

type Props = {
  campaign: any;
  onBrowse?: () => void;
  browseLabel?: string;
};

function platformLabel(platform?: string) {
  if (platform === 'facebook') return 'Facebook';
  if (platform === 'x') return 'X';
  return platform || 'Social';
}

function ProgressRing({ percent, confirmed, required }: { percent: number; confirmed: number; required: number }) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{confirmed}</Text>
        <Text style={styles.ringLabel}>of {required}</Text>
      </View>
    </View>
  );
}

export function EbookShareCampaignPanel({
  campaign,
  onBrowse,
  browseLabel = 'Browse ebooks',
}: Props) {
  const [copied, setCopied] = useState(false);

  const requiredShares = Number(campaign?.required_shares || 5);
  const confirmedShares = Number(campaign?.confirmed_shares || 0);
  const remainingShares = Math.max(0, requiredShares - confirmedShares);

  const progressPercent = useMemo(() => {
    if (requiredShares <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((confirmedShares / requiredShares) * 100));
  }, [confirmedShares, requiredShares]);

  const milestones = useMemo(
    () => Array.from({ length: requiredShares }, (_, index) => ({
      number: index + 1,
      complete: index < confirmedShares,
    })),
    [confirmedShares, requiredShares],
  );

  const canShareMore = campaign?.can_start && !campaign?.rewarded;
  const isRewarded = Boolean(campaign?.rewarded && campaign?.coupon_code);
  const events = Array.isArray(campaign?.events) ? campaign.events : [];

  const copyCoupon = async () => {
    const code = campaign?.coupon_code;
    if (!code) {
      return;
    }

    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[...heroGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroBadge}>
          <Ionicons name="sparkles-outline" size={14} color="rgba(236,253,245,0.95)" />
          <Text style={styles.heroBadgeText}>Share & Earn</Text>
        </View>

        <Text style={styles.heroTitle}>Share 5 ebooks, get 1 free</Text>
        <Text style={styles.heroSubtitle}>
          Share five different ebooks on Facebook or X. When you finish, we email you a coupon for one free paid ebook.
        </Text>

        <View style={styles.heroProgressCard}>
          <ProgressRing percent={progressPercent} confirmed={confirmedShares} required={requiredShares} />
          <View style={styles.heroProgressMeta}>
            <Text style={styles.heroProgressLabel}>Campaign progress</Text>
            <Text style={styles.heroProgressValue}>{progressPercent}%</Text>
            <Text style={styles.heroProgressHint}>
              {remainingShares} share{remainingShares === 1 ? '' : 's'} left
            </Text>
          </View>
        </View>

        <View style={styles.milestones}>
          {milestones.map((milestone) => (
            <View
              key={milestone.number}
              style={[styles.milestone, milestone.complete ? styles.milestoneComplete : styles.milestonePending]}
            >
              {milestone.complete ? (
                <Ionicons name="checkmark" size={18} color="#047857" />
              ) : (
                <Text style={styles.milestoneText}>{milestone.number}</Text>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Confirmed</Text>
          <Text style={styles.statValue}>{confirmedShares}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>{remainingShares}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Goal</Text>
          <Text style={styles.statValue}>{requiredShares}</Text>
        </View>
      </View>

      {isRewarded ? (
        <LinearGradient colors={['#ecfdf5', '#ffffff', '#f0fdfa']} style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <View style={styles.couponIconWrap}>
              <Ionicons name="gift-outline" size={26} color="#fff" />
            </View>
            <View style={styles.couponCopy}>
              <Text style={styles.couponEyebrow}>Reward unlocked</Text>
              <Text style={styles.couponTitle}>Your free ebook coupon</Text>
              <Text style={styles.couponHint}>Redeem it on any paid ebook in the library.</Text>
            </View>
          </View>

          <View style={styles.couponCodeBox}>
            <Text style={styles.couponCode}>{campaign.coupon_code}</Text>
          </View>

          <Pressable style={styles.copyButton} onPress={() => void copyCoupon()}>
            <Ionicons name={copied ? 'checkmark-circle-outline' : 'copy-outline'} size={18} color="#fff" />
            <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy coupon code'}</Text>
          </Pressable>
        </LinearGradient>
      ) : null}

      {events.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your shared ebooks</Text>
          <Text style={styles.sectionSubtitle}>Track each share and its confirmation status.</Text>

          {events.map((event: any) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventCoverWrap}>
                {event.cover_image_url ? (
                  <AppImage
                    uri={resolveMediaUrl(event.cover_image_url)}
                    style={styles.eventCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.eventCoverFallback}>
                    <Ionicons name="book-outline" size={24} color={colors.text.muted} />
                  </View>
                )}
              </View>

              <View style={styles.eventBody}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.eventBadges}>
                  <View
                    style={[
                      styles.badge,
                      event.status === 'confirmed' ? styles.badgeConfirmed : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        event.status === 'confirmed' ? styles.badgeTextConfirmed : styles.badgeTextPending,
                      ]}
                    >
                      {event.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </Text>
                  </View>
                  {event.platform ? (
                    <View
                      style={[
                        styles.badge,
                        event.platform === 'facebook' ? styles.badgeFacebook : styles.badgeX,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          event.platform === 'facebook' ? styles.badgeTextFacebook : styles.badgeTextX,
                        ]}
                      >
                        {platformLabel(event.platform)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {event.status === 'confirmed' ? (
                <Ionicons name="checkmark-circle" size={24} color="#059669" />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {canShareMore ? (
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <View style={styles.helpIconWrap}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>How to share</Text>
              <Text style={styles.sectionSubtitle}>Three quick steps to earn your free ebook.</Text>
            </View>
          </View>

          {HOW_TO_STEPS.map((step, index) => (
            <View key={step} style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={STEP_ICONS[index] || 'share-social-outline'} size={18} color={colors.text.primary} />
              </View>
              <Text style={styles.stepEyebrow}>Step {index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {onBrowse ? (
            <Pressable style={styles.browseButton} onPress={onBrowse}>
              <Text style={styles.browseButtonText}>{browseLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!campaign?.eligible ? (
        <View style={styles.ineligibleCard}>
          <Text style={styles.ineligibleText}>Your account is not eligible for this campaign.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  hero: {
    borderRadius: 28,
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  heroGlowOne: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroGlowTwo: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: 'rgba(165,243,252,0.18)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(236,253,245,0.95)',
  },
  heroTitle: {
    marginTop: spacing.md,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: 'rgba(236,253,245,0.9)',
  },
  heroProgressCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ringWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  ringLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(236,253,245,0.82)',
  },
  heroProgressMeta: {
    flex: 1,
  },
  heroProgressLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(236,253,245,0.82)',
  },
  heroProgressValue: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  heroProgressHint: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: 'rgba(236,253,245,0.82)',
  },
  milestones: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneComplete: {
    backgroundColor: '#fff',
  },
  milestonePending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  milestoneText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: '#fff',
    padding: spacing.md,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  statValue: {
    marginTop: spacing.sm,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  couponCard: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 24,
    padding: spacing.lg,
  },
  couponHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  couponIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
  },
  couponCopy: {
    flex: 1,
  },
  couponEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#047857',
  },
  couponTitle: {
    marginTop: 4,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  couponHint: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  couponCodeBox: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#86efac',
    borderRadius: radii.xl,
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  couponCode: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
    color: '#065f46',
  },
  copyButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: '#059669',
    paddingVertical: spacing.sm + 2,
  },
  copyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  eventCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: '#fff',
    padding: spacing.md,
  },
  eventCoverWrap: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  eventCover: {
    width: 72,
    height: 96,
  },
  eventCoverFallback: {
    width: 72,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  eventBadges: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeConfirmed: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgePending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeFacebook: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  badgeX: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  badgeTextConfirmed: {
    color: '#047857',
  },
  badgeTextPending: {
    color: '#b45309',
  },
  badgeTextFacebook: {
    color: '#1d4ed8',
  },
  badgeTextX: {
    color: '#0f172a',
  },
  helpCard: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: spacing.lg,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  helpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  stepCard: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: '#f8fafc',
    padding: spacing.md,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepEyebrow: {
    marginTop: spacing.md,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.muted,
  },
  stepText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  browseButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: '#0f172a',
    paddingVertical: spacing.md,
  },
  browseButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  ineligibleCard: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    padding: spacing.lg,
    alignItems: 'center',
  },
  ineligibleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
