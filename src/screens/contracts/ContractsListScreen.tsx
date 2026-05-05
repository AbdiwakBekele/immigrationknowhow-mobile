import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
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
    <AppScreen variant="gradient" style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Contracts</Text>
        <Text style={styles.heroTitle}>Manage your agreements</Text>
        <Text style={styles.heroBody}>Track contract status, review terms, and open details.</Text>
      </View>

      {!loading && !error && (
        <Text style={styles.resultText}>
          {items.length} contract{items.length === 1 ? '' : 's'}
        </Text>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No contracts yet.</Text>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
          data={items}
          keyExtractor={(c) => c.uuid}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('ContractDetail', { uuid: item.uuid })}
              style={styles.card}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.provider?.business_name ?? 'Contract'}
                </Text>
                <View style={[styles.statePill, stateTone(item.state)]}>
                  <Text style={styles.stateText}>{item.state.replace('_', ' ')}</Text>
                </View>
              </View>
              {!!item.lead?.service_type && (
                <Text style={styles.serviceTypeText}>
                  {item.lead.service_type}
                </Text>
              )}
              <View style={styles.openRow}>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
                <Text style={styles.openRowText}>Open contract</Text>
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
    padding: spacing.xl,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d5e3ff',
    backgroundColor: '#eef4ff',
    padding: spacing.lg,
  },
  heroEyebrow: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
  },
  resultText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loadingWrap: {
    marginTop: spacing['3xl'],
  },
  errorText: {
    marginTop: spacing.lg,
    color: colors.danger,
  },
  emptyText: {
    marginTop: spacing.lg,
    color: colors.text.secondary,
  },
  list: {
    marginTop: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#dde4ef',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  statePill: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    fontWeight: typography.fontWeight.medium,
  },
  serviceTypeText: {
    marginTop: spacing.sm,
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
  },
  openRow: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  openRowText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
});

function stateTone(state: string) {
  switch (state.toLowerCase()) {
    case 'accepted':
    case 'active':
      return { borderColor: '#86efac', backgroundColor: '#dcfce7' };
    case 'sent':
    case 'pending':
      return { borderColor: '#93c5fd', backgroundColor: '#dbeafe' };
    case 'ended':
    case 'withdrawn':
      return { borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' };
    default:
      return { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' };
  }
}

