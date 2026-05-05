import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
        borderColor: '#dde4ef',
        borderRadius: 18,
        backgroundColor: colors.surface,
        marginBottom: spacing.md,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 2,
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
  const [query, setQuery] = useState('');

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

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const title = item.business_name || `${item.user?.first_name ?? ''} ${item.user?.last_name ?? ''}`.trim() || '';
      const location = item.location_display || '';
      const tagline = item.tagline || '';
      return [title, location, tagline].some((part) => part.toLowerCase().includes(q));
    });
  }, [items, query]);

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#cfe0ff',
          backgroundColor: '#edf4ff',
          padding: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.primary[700], fontWeight: typography.fontWeight.semibold, letterSpacing: 1 }}>
          PROVIDERS
        </Text>
        <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Find trusted providers
        </Text>
        <View
          style={{
            marginTop: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#d9e2ef',
            borderRadius: 12,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search provider name..."
            placeholderTextColor={colors.text.muted}
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              paddingVertical: spacing.md,
              color: colors.text.primary,
            }}
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
        <Text style={{ color: colors.text.secondary }}>
          {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
        </Text>
      </View>

      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={filteredItems}
          keyExtractor={(p) => p.slug}
          renderItem={({ item }) => (
            <ProviderRow item={item} onPress={() => navigation.navigate('ProviderDetail', { slug: item.slug })} />
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.text.secondary, marginTop: spacing.md }}>
              {query.trim() ? 'No providers match your search.' : 'No providers found.'}
            </Text>
          }
        />
      )}
    </AppScreen>
  );
}

