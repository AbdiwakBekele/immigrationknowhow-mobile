import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const heroGradient = ['#059669', '#0d9488', '#0e7490'] as const;

type Props = {
  confirmedShares: number;
  requiredShares: number;
  bookAlreadyShared: boolean;
  onShare: () => void;
  onViewCampaign: () => void;
};

export function EbookShareDetailCard({
  confirmedShares,
  requiredShares,
  bookAlreadyShared,
  onShare,
  onViewCampaign,
}: Props) {
  const progressPercent = useMemo(() => {
    if (requiredShares <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((confirmedShares / requiredShares) * 100));
  }, [confirmedShares, requiredShares]);

  return (
    <LinearGradient colors={[...heroGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="gift-outline" size={20} color="#fff" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Share & Earn</Text>
          <Text style={styles.title}>Share for a free ebook</Text>
          <Text style={styles.subtitle}>
            {confirmedShares} of {requiredShares} shares complete
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      {bookAlreadyShared ? (
        <Text style={styles.doneText}>This book is already counted toward your reward.</Text>
      ) : (
        <Pressable style={styles.shareButton} onPress={onShare}>
          <Ionicons name="share-social-outline" size={18} color="#047857" />
          <Text style={styles.shareButtonText}>Share for free book</Text>
        </Pressable>
      )}

      <Pressable onPress={onViewCampaign}>
        <Text style={styles.link}>View campaign progress</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    borderRadius: 24,
    padding: spacing.md,
    overflow: 'hidden',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(236,253,245,0.9)',
  },
  title: {
    marginTop: 4,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: 'rgba(236,253,245,0.88)',
  },
  track: {
    marginTop: spacing.md,
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
  doneText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(236,253,245,0.95)',
  },
  shareButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: '#fff',
    paddingVertical: spacing.sm + 2,
  },
  shareButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#047857',
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    textDecorationLine: 'underline',
  },
});
