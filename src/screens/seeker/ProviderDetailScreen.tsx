import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as providersApi from '../../api/providersApi';
import type { ProvidersStackParamList } from './ProvidersStack';

type R = RouteProp<ProvidersStackParamList, 'ProviderDetail'>;

export function ProviderDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<NativeStackNavigationProp<ProvidersStackParamList>>();
  const { slug } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [canContact, setCanContact] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await providersApi.getProvider(slug);
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setProvider(res.data.provider);
      setCanContact(!!res.data.canContactProvider);
    })();
  }, [slug]);

  if (loading) {
    return (
      <AppScreen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error || !provider) {
    return (
      <AppScreen style={styles.padded}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorText}>{error ?? 'Provider not found'}</Text>
      </AppScreen>
    );
  }

  const title = provider.business_name || `${provider.user?.first_name ?? ''} ${provider.user?.last_name ?? ''}`.trim() || 'Provider';
  const avatarUrl = provider.user?.avatar_url as string | undefined;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="business" size={36} color={colors.text.muted} />
            </View>
          )}
          <View style={styles.heroText}>
            <Text style={styles.title}>{title}</Text>
            {!!provider.tagline && <Text style={styles.tagline}>{provider.tagline}</Text>}
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.text.muted} />
              <Text style={styles.meta} numberOfLines={2}>
                {provider.location_display}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={colors.secondary[500]} />
              <Text style={styles.meta}>
                {provider.average_rating ? `${Number(provider.average_rating).toFixed(1)}` : '—'} · {provider.total_reviews ?? 0}{' '}
                reviews
              </Text>
            </View>
          </View>
        </View>

        {!!provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}

        <View style={styles.ctaWrap}>
          <AppButton
            title={canContact ? 'Contact provider' : 'Sign in as a seeker to contact'}
            onPress={() => navigation.navigate('ContactProvider', { slug })}
            disabled={!canContact}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.sectionTitle}>Recent reviews</Text>
          </View>
          {(provider.reviews ?? []).length === 0 ? (
            <Text style={styles.emptyReviews}>No reviews yet.</Text>
          ) : (
            provider.reviews.map((r: any) => (
              <View key={r.uuid} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Ionicons name="star" size={16} color={colors.secondary[500]} />
                  <Text style={styles.reviewRating}>{r.rating} out of 5</Text>
                </View>
                {!!r.body && <Text style={styles.reviewBody}>{r.body}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const AV = 88;

const styles = StyleSheet.create({
  centered: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  padded: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  heroCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.softLg,
  },
  avatar: {
    width: AV,
    height: AV,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: AV,
    height: AV,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: spacing.lg,
    minWidth: 0,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  tagline: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  meta: {
    flex: 1,
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  bio: {
    marginTop: spacing.xl,
    color: colors.text.secondary,
    lineHeight: 24,
    fontSize: typography.fontSize.md,
  },
  ctaWrap: {
    marginTop: spacing['2xl'],
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  emptyReviews: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
  },
  reviewCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewRating: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  reviewBody: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    fontSize: typography.fontSize.md,
  },
});
