import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as libraryApi from '../../api/libraryApi';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { LibraryCover } from '../library/LibraryCover';

type Props = {
  onPress: () => void;
  title?: string;
  subtitle?: string;
};

/**
 * Discover / Hub entry for My Library: loads a preview item from browse API
 * (includes `cover_image_url`) and shows it as the card artwork.
 */
export function MyLibraryEntryCard({ onPress, title = 'My Library', subtitle = 'Guides & resources' }: Props) {
  const [loading, setLoading] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [sampleTitle, setSampleTitle] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.browseLibrary({ per_page: 1, page: 1 });
    setLoading(false);
    if (!res.success) {
      setCoverUrl(null);
      setSampleTitle(null);
      return;
    }
    const raw = res.data?.items?.data?.data ?? res.data?.items?.data ?? [];
    const first = Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
    const u = first?.cover_image_url != null ? resolveMediaUrl(String(first.cover_image_url)) : null;
    setCoverUrl(u);
    setSampleTitle(typeof first?.title === 'string' ? first.title : null);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} accessibilityRole="button">
      <View style={styles.coverWrap}>
        <View style={styles.coverSlot}>
          <LibraryCover uri={coverUrl} width={72} height={96} borderRadius={12} />
          {loading ? (
            <View style={styles.coverLoading}>
              <ActivityIndicator color="rgba(255,255,255,0.95)" />
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        {!!sampleTitle && (
          <Text style={styles.sample} numberOfLines={1}>
            Featured: {sampleTitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  coverWrap: {
    marginRight: spacing.md,
  },
  coverSlot: {
    width: 72,
    height: 96,
    position: 'relative',
  },
  coverLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  sample: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
