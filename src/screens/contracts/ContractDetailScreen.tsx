import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as contractsApi from '../../api/contractsApi';
import { useAuth } from '../../context/AuthContext';
import type { ContractsStackParamList } from './ContractsStack';

type R = RouteProp<ContractsStackParamList, 'ContractDetail'>;

export function ContractDetailScreen() {
  const route = useRoute<R>();
  const { uuid } = route.params;
  const { role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<contractsApi.ContractItem | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await contractsApi.getContract(uuid);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setContract(res.data.contract);
  }

  useEffect(() => {
    void load();
  }, [uuid]);

  async function onAccept() {
    if (!contract) return;
    setBusy(true);
    const res = await contractsApi.acceptContract(contract.uuid);
    setBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    await load();
  }

  async function onWithdraw() {
    if (!contract?.lead?.uuid) return;
    setBusy(true);
    const res = await contractsApi.withdrawContract(contract.lead.uuid);
    setBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    await load();
  }

  async function onEnd() {
    if (!contract?.lead?.uuid) return;
    setBusy(true);
    const res = await contractsApi.endContract(contract.lead.uuid, reason.trim() || undefined);
    setBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    await load();
  }

  return (
    <AppScreen style={styles.screen}>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !contract ? (
        <View style={styles.centerState}>
          <Text style={styles.mutedText}>Contract not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Contract details</Text>
            <Text style={styles.heroTitle}>Contract</Text>
            <View style={[styles.statePill, stateTone(contract.state)]}>
              <Text style={styles.stateText}>{contract.state.replace('_', ' ')}</Text>
            </View>
          </View>

          {!!contract.provider?.business_name && (
            <Text style={styles.providerText}>
              Provider: {contract.provider.business_name}
            </Text>
          )}

          {!!contract.lead?.message && (
            <View style={styles.infoCard}>
              <View style={styles.infoTitleRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.text.muted} />
                <Text style={styles.infoTitle}>Lead message</Text>
              </View>
              <Text style={styles.infoBody}>{contract.lead.message}</Text>
            </View>
          )}

          <View style={styles.actionsWrap}>
            {role === 'provider' ? (
              <AppButton title="Accept offer" onPress={onAccept} loading={busy} />
            ) : (
              <>
                <AppButton title="Withdraw offer" onPress={onWithdraw} loading={busy} variant="ghost" />
                <AppInput label="End reason (optional)" value={reason} onChangeText={setReason} placeholder="Reason" />
                <AppButton title="End contract" onPress={onEnd} loading={busy} variant="secondary" />
              </>
            )}
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.danger,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
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
  statePill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
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
  providerText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  infoCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#dde4ef',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoTitle: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  infoBody: {
    marginTop: spacing.sm,
    color: colors.text.primary,
  },
  actionsWrap: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
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

