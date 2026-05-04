import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providersApi from '../../api/providersApi';
import type { ProviderListItem } from '../../types/provider';
import type { ProvidersStackParamList } from './ProvidersStack';

function ProviderRow({ item, onPress }: { item: ProviderListItem; onPress: () => void }) {
  const title = item.business_name || `${item.user?.first_name ?? ''} ${item.user?.last_name ?? ''}`.trim() || 'Provider';
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        backgroundColor: colors.surface,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
        {title}
      </Text>
      {!!item.tagline && (
        <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
          {item.tagline}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
        {!!item.location_display && (
          <Text style={{ color: colors.text.muted, fontSize: typography.fontSize.sm }}>
            {item.location_display}
          </Text>
        )}
        <Text style={{ color: colors.text.muted, fontSize: typography.fontSize.sm }}>
          {item.average_rating ? `${Number(item.average_rating).toFixed(1)}★` : 'No rating'} · {item.total_reviews ?? 0} reviews
        </Text>
      </View>
    </Pressable>
  );
}

export function ProvidersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProvidersStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProviderListItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await providersApi.listProviders({ per_page: 20 });
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.providers.data ?? []);
    })();
  }, []);

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
        Browse service providers from the marketplace.
      </Text>

      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(p) => p.slug}
          renderItem={({ item }) => (
            <ProviderRow item={item} onPress={() => navigation.navigate('ProviderDetail', { slug: item.slug })} />
          )}
        />
      )}
    </AppScreen>
  );
}

