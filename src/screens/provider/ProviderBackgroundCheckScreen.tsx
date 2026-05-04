import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as api from '../../api/providerBackgroundChecksApi';

export function ProviderBackgroundCheckScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<api.ProviderBackgroundChecksPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [zipcode, setZipcode] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [ssn, setSsn] = useState('');
  const [consent, setConsent] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getProviderBackgroundChecks();
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setData(res.data.payload);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const initiate = async () => {
    if (!data) return;
    if (!consent) {
      Alert.alert('Background check', 'Please confirm consent to proceed.');
      return;
    }
    const user = data.user ?? {};
    setBusy(true);
    const res = await api.startProviderBackgroundCheck({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      zipcode,
      dob,
      ssn,
      consent: true,
    });
    setBusy(false);
    if (!res.success) {
      Alert.alert('Background check', res.message);
      return;
    }
    Alert.alert('Background check', res.message);
    void load();
  };

  const refresh = async (uuid: string) => {
    setBusy(true);
    const res = await api.refreshProviderBackgroundCheck(uuid);
    setBusy(false);
    if (!res.success) Alert.alert('Background check', res.message);
    else void load();
  };

  if (loading && !data) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const latest = data?.background_check;

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}

        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Status
        </Text>

        <View style={cardStyle()}>
          <Text style={{ color: colors.text.muted }}>Current</Text>
          <Text style={{ marginTop: 4, color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>
            {latest?.status_display ?? latest?.status ?? 'Not started'}
          </Text>
          {!!latest?.expires_at && (
            <Text style={{ marginTop: 4, color: colors.text.secondary }}>Expires: {latest.expires_at}</Text>
          )}
          {latest?.uuid ? (
            <Pressable onPress={() => void refresh(latest.uuid)} disabled={busy} style={{ marginTop: spacing.md }}>
              <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>
                {busy ? 'Refreshing…' : 'Refresh status'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={{ marginTop: spacing['2xl'], fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
          Start a background check
        </Text>
        <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
          This will be processed by our verification partner. You may be emailed to complete steps.
        </Text>

        <TextInput placeholder="Zip code" value={zipcode} onChangeText={setZipcode} style={inp()} />
        <TextInput placeholder="DOB (YYYY-MM-DD)" value={dob} onChangeText={setDob} style={inp()} />
        <TextInput placeholder="SSN (XXX-XX-XXXX)" value={ssn} onChangeText={setSsn} style={inp()} />

        <Pressable onPress={() => setConsent((c) => !c)} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.text.primary }}>{consent ? '☑' : '☐'} I consent to the background check</Text>
        </Pressable>

        <Pressable
          onPress={() => void initiate()}
          disabled={busy || !data?.can_initiate}
          style={{
            marginTop: spacing.lg,
            backgroundColor: colors.primary[600],
            padding: spacing.md,
            borderRadius: 12,
            opacity: busy || !data?.can_initiate ? 0.5 : 1,
          }}
        >
          <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>
            {busy ? 'Submitting…' : 'Start'}
          </Text>
        </Pressable>

        <Text style={{ marginTop: spacing['2xl'], fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
          History
        </Text>
        {(data?.history ?? []).length === 0 ? (
          <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>No history yet.</Text>
        ) : (
          (data?.history ?? []).map((h) => (
            <View key={h.uuid} style={[cardStyle(), { marginTop: spacing.sm }]}>
              <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>{h.status_display ?? h.status}</Text>
              <Text style={{ marginTop: 2, color: colors.text.muted }}>{h.initiated_at ?? ''}</Text>
            </View>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

function cardStyle() {
  return {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  } as const;
}

function inp() {
  return {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  } as const;
}

