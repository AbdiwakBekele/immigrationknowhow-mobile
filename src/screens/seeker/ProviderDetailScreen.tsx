import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useAuth } from '../../context/AuthContext';
import * as providersApi from '../../api/providersApi';
import type { ProviderDetail } from '../../types/provider';
import type { ProvidersStackParamList } from './ProvidersStack';

type R = RouteProp<ProvidersStackParamList, 'ProviderDetail'>;

export function ProviderDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<NativeStackNavigationProp<ProvidersStackParamList>>();
  const { slug } = route.params;
  const { isAuthenticated, hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [canContact, setCanContact] = useState(false);
  const [canFavorite, setCanFavorite] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
      setCanFavorite(!!res.data.canFavoriteProvider);
      setIsFavorited(!!res.data.isFavorited);
    })();
  }, [slug]);

  async function onToggleFavorite() {
    if (!canFavorite || !provider || favoriteLoading) return;
    const previous = isFavorited;
    setError(null);
    setFavoriteLoading(true);
    setIsFavorited(!previous);
    const res = await providersApi.toggleFavorite(provider.slug);
    setFavoriteLoading(false);
    if (!res.success) {
      setIsFavorited(previous);
      setError(res.message);
      return;
    }
    const next = !!res.data.favorited;
    setIsFavorited(next);
    setProvider((current) => (current ? { ...current, is_favorited: next } : current));
  }

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
  const serviceChips = (provider.service_types ?? []).filter(Boolean).slice(0, 4);
  const canSwitchToSeeker = hasRole('user') && hasRole('provider');
  const showContactCta = !isAuthenticated || canContact || canSwitchToSeeker;
  const contactButtonTitle = !isAuthenticated
    ? 'Sign in to contact'
    : canContact
      ? 'Contact provider'
      : canSwitchToSeeker
        ? 'Switch to seeker account'
        : 'Contact unavailable';

  function onContactPress() {
    if (!canContact) {
      navigation.getParent()?.navigate('Profile');
      return;
    }
    navigation.navigate('ContactProvider', { slug });
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          {canFavorite ? (
            <Pressable onPress={() => void onToggleFavorite()} style={styles.favoriteButton}>
              {favoriteLoading ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? '#e11d48' : colors.text.muted} />
              )}
            </Pressable>
          ) : null}
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
            <View style={styles.modeRow}>
              {provider.serves_remote ? (
                <View style={styles.modeChip}>
                  <Text style={styles.modeChipText}>Remote</Text>
                </View>
              ) : null}
              {provider.serves_in_person ? (
                <View style={styles.modeChip}>
                  <Text style={styles.modeChipText}>In person</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {serviceChips.length > 0 ? (
          <View style={styles.serviceRow}>
            {serviceChips.map((service) => (
              <View key={service} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{service}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!!provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}

        <View style={styles.ctaRow}>
          {canFavorite ? (
            <AppButton
              title={isFavorited ? 'Saved' : 'Save provider'}
              onPress={() => void onToggleFavorite()}
              loading={favoriteLoading}
              variant="ghost"
              style={styles.secondaryAction}
            />
          ) : null}
          {showContactCta ? (
            <AppButton
              title={contactButtonTitle}
              onPress={onContactPress}
              disabled={isAuthenticated && !canContact && !canSwitchToSeeker}
              style={canFavorite ? styles.primaryAction : undefined}
            />
          ) : null}
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
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffffee',
    alignItems: 'center',
    justifyContent: 'center',
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
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modeChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  modeChipText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  meta: {
    flex: 1,
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  serviceRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceChip: {
    borderRadius: radii.full,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#dbe2ef',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  serviceChipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bio: {
    marginTop: spacing.xl,
    color: colors.text.secondary,
    lineHeight: 24,
    fontSize: typography.fontSize.md,
  },
  ctaRow: {
    marginTop: spacing['2xl'],
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryAction: {
    flex: 1,
  },
  primaryAction: {
    flex: 1.35,
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
