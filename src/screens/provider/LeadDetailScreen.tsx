import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providerLeadsApi from '../../api/providerLeadsApi';
import type { LeadsStackParamList } from './LeadsStack';

type R = RouteProp<LeadsStackParamList, 'LeadDetail'>;

export function LeadDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<NativeStackNavigationProp<LeadsStackParamList>>();
  const { uuid } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<providerLeadsApi.ProviderLead | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await providerLeadsApi.getProviderLead(uuid);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setLead(res.data.lead);
  }

  useEffect(() => {
    void load();
  }, [uuid]);

  async function onAcceptContract() {
    if (!lead) return;
    setBusy(true);
    const res = await providerLeadsApi.updateLeadStatus(lead.uuid, 'in_progress');
    setBusy(false);
    if (!res.success) setError(res.message);
    else setLead(res.data.lead);
  }

  async function onAddNote() {
    if (!lead || !note.trim()) return;
    setBusy(true);
    const res = await providerLeadsApi.addLeadNote(lead.uuid, note.trim());
    setBusy(false);
    if (!res.success) setError(res.message);
    else {
      setNote('');
      setLead(res.data.lead);
    }
  }

  async function onOpenChat() {
    if (!lead) return;
    setBusy(true);
    let convUuid = lead.conversation?.uuid;
    if (!convUuid) {
      const res = await providerLeadsApi.createLeadConversation(lead.uuid);
      setBusy(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      convUuid = res.data.conversation_uuid;
    } else {
      setBusy(false);
    }
    navigation.navigate('Chat', { uuid: convUuid });
  }

  async function onDecline() {
    if (!lead) return;
    setBusy(true);
    const res = await providerLeadsApi.declineLead(lead.uuid);
    setBusy(false);
    if (!res.success) setError(res.message);
    else setLead(res.data.lead);
  }

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error || !lead) {
    return (
      <AppScreen style={{ padding: spacing.xl }}>
        <Text style={{ color: colors.danger }}>{error ?? 'Lead not found'}</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Lead
        </Text>
        <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
          {lead.user?.first_name} {lead.user?.last_name} · {lead.status}
        </Text>

        <View style={{ marginTop: spacing.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
          <Text style={{ color: colors.text.primary }}>{lead.message}</Text>
        </View>

        <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
          <AppButton title="Open messages" onPress={onOpenChat} loading={busy} />
          <AppButton title="Accept contract (In progress)" onPress={onAcceptContract} loading={busy} variant="secondary" />
          <AppButton title="Decline lead" onPress={onDecline} loading={busy} variant="ghost" />
        </View>

        <View style={{ marginTop: spacing['2xl'] }}>
          <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.sm }}>
            Add note
          </Text>
          <AppInput label="Note" value={note} onChangeText={setNote} placeholder="Internal note…" autoCapitalize="sentences" />
          <AppButton title="Save note" onPress={onAddNote} loading={busy} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
