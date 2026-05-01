import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
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
    <AppScreen style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      ) : !contract ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.text.secondary }}>Contract not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
            Contract
          </Text>
          <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
            State: {contract.state}
          </Text>
          {!!contract.provider?.business_name && (
            <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
              Provider: {contract.provider.business_name}
            </Text>
          )}

          {!!contract.lead?.message && (
            <View style={{ marginTop: spacing.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
              <Text style={{ color: colors.text.muted, fontSize: typography.fontSize.sm }}>Lead</Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.primary }}>{contract.lead.message}</Text>
            </View>
          )}

          <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
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

