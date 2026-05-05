import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppImage } from '../../components/AppImage';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as communityApi from '../../api/communityApi';
import type { CommunityNewsItem } from '../../api/communityApi';

const COUNTRIES = ['US', 'EU', 'CA', 'GB'] as const;

export function CommunityNewsScreen() {
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>('US');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CommunityNewsItem[]>([]);
  const [error, setError] = useState('');

  const load = async (c: (typeof COUNTRIES)[number]) => {
    setLoading(true);
    setError('');
    const res = await communityApi.getCommunityNews({ country: c, limit: 15 });
    setLoading(false);
    if (!res.success) {
      setItems([]);
      setError(res.message);
      return;
    }
    if (res.data.error) setError(res.data.error);
    setItems(res.data.items ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load(country);
    }, [country])
  );

  return (
    <AppScreen style={styles.screen}>
      <Text style={styles.title}>Immigration news</Text>
      <Text style={styles.subtitle}>Headlines from trusted sources for your region.</Text>

      <View style={styles.chipsRow}>
        {COUNTRIES.map((c) => {
          const active = country === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCountry(c)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['2xl'] }} size="large" color={colors.primary[600]} />
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(it) => it.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>{error || 'No headlines right now.'}</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => void Linking.openURL(item.url)}
              style={styles.card}
              accessibilityRole="link"
            >
              {!!item.image && (
                <AppImage uri={item.image} height={140} style={styles.cardImage} contentFit="cover" />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!!item.summary && (
                  <Text style={styles.summary} numberOfLines={3}>
                    {item.summary}
                  </Text>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="newspaper-outline" size={14} color={colors.text.muted} />
                  <Text style={styles.source}>{item.source}</Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons name="open-outline" size={16} color={colors.primary[500]} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  chipText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },
  chipTextActive: {
    color: colors.primary[800],
  },
  list: {
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.text.secondary,
    marginTop: spacing.lg,
    fontSize: typography.fontSize.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    ...shadows.soft,
  },
  cardImage: {
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  summary: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    fontSize: typography.fontSize.sm,
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  source: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
