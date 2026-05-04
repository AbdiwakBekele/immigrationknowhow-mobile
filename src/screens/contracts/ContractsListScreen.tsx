import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as contractsApi from '../../api/contractsApi';
import type { ContractsStackParamList } from './ContractsStack';

export function ContractsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ContractsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<contractsApi.ContractItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await contractsApi.listContracts();
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.contracts.data ?? []);
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
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No contracts yet.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(c) => c.uuid}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('ContractDetail', { uuid: item.uuid })}
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
                {item.provider?.business_name ?? 'Contract'}
              </Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
                State: {item.state}
              </Text>
              {!!item.lead?.service_type && (
                <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.sm }}>
                  {item.lead.service_type}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}

