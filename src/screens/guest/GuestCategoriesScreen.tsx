import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';
import type { GuestTabParamList } from '../../navigation/GuestNavigator';
import type { IonIconName } from '../../navigation/tabBar';

const CATEGORY_ICONS: Record<string, IonIconName> = {
  immigration_attorney: 'briefcase-outline',
  accredited_representative: 'ribbon-outline',
  notary: 'document-text-outline',
  tax_preparer: 'calculator-outline',
  real_estate_agent: 'home-outline',
  insurance_agent: 'shield-outline',
  financial_advisor: 'trending-up-outline',
  translator: 'language-outline',
  babysitter: 'happy-outline',
  pet_sitter: 'paw-outline',
};

function categoryIcon(value: string): IonIconName {
  return CATEGORY_ICONS[value] ?? 'grid-outline';
}

export function GuestCategoriesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<GuestTabParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await guestApi.getGuestMeta();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setCategories(res.data.service_types ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  function openCategory(value: string) {
    navigation.navigate('GuestProviders', { service_type: value });
  }

  const listHeader = (
    <View style={styles.heroCard}>
      <Text style={styles.heroTitle}>Browse service categories</Text>
      <Text style={styles.heroSubtitle}>
        Explore immigration and related services. Tap a category to preview matching service providers — no account
        required.
      </Text>
    </View>
  );

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      {loading && categories.length === 0 ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error && categories.length === 0 ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.value}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openCategory(item.value)}
              style={styles.categoryCard}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.label}`}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={categoryIcon(item.value)} size={24} color={colors.primary[700]} />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={3}>
                {item.label}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.browseLink}>Browse</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary[600]} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No service categories available right now.</Text>}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    textAlign: 'center',
    color: colors.danger,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  categoryCard: {
    flex: 1,
    minHeight: 148,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  browseLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: spacing.xl,
    lineHeight: 20,
  },
});
