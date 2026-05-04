import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerLeadsApi from '../../api/providerLeadsApi';
import type { LeadsStackParamList } from './LeadsStack';

export function LeadsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LeadsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<providerLeadsApi.ProviderLead[]>([]);

  useEffect(() => {
    (async () => {
      const res = await providerLeadsApi.listProviderLeads();
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.leads.data ?? []);
    })();
  }, []);

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No leads yet.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(l) => l.uuid}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('LeadDetail', { uuid: item.uuid })}
              style={{
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {item.user?.first_name} {item.user?.last_name}
              </Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={{ marginTop: spacing.sm, color: colors.text.muted, fontSize: typography.fontSize.sm }}>
                {item.status} · {item.service_type}
              </Text>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}
