import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providersApi from '../../api/providersApi';
import * as leadsApi from '../../api/leadsApi';
import type { SeekerBottomTabParamList } from '../../navigation/SeekerBottomTabs';
import type { ProvidersStackParamList } from './ProvidersStack';

type R = RouteProp<ProvidersStackParamList, 'ContactProvider'>;
type ContactProviderNav = CompositeNavigationProp<
  NativeStackNavigationProp<ProvidersStackParamList, 'ContactProvider'>,
  BottomTabNavigationProp<SeekerBottomTabParamList>
>;
type ContactMode = 'message' | 'offer';

export function ContactProviderScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<ContactProviderNav>();
  const { slug } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ContactMode>('message');
  const [serviceType, setServiceType] = useState('');
  const [message, setMessage] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  useEffect(() => {
    (async () => {
      const res = await providersApi.getProvider(slug);
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      const firstType = (res.data.provider.service_types ?? [])[0];
      if (firstType) setServiceType(firstType);
    })();
  }, [slug]);

  async function onSubmit() {
    setError(null);
    const normalizedServiceType = serviceType.trim();
    const normalizedMessage = message.trim();

    if (!normalizedServiceType) {
      setError('Please choose a service type.');
      return;
    }
    if (mode === 'offer' && !normalizedMessage) {
      setError('Please choose a service type and describe the offer.');
      return;
    }
    const normalizedRate = offeredRate.trim();
    if (mode === 'offer' && normalizedRate) {
      const parsed = Number(normalizedRate);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Enter a valid offer rate or leave it blank.');
        return;
      }
    }
    setSubmitting(true);
    const fallbackInquiryMessage = `Hi, I need help with ${normalizedServiceType}.`;
    const res = await leadsApi.createLead(slug, {
      service_type: normalizedServiceType,
      message: normalizedMessage || fallbackInquiryMessage,
      urgency,
      intent: mode === 'offer' ? 'offer' : 'inquiry',
      offered_rate: mode === 'offer' && normalizedRate ? Number(normalizedRate) : undefined,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.message);
      return;
    }

    const conversationUuid = res.data.conversation?.uuid;
    const contractUuid = res.data.contract_uuid ?? res.data.conversation?.lead?.contract_uuid ?? null;

    if (mode === 'offer' && contractUuid) {
      navigation.navigate('Discover', {
        screen: 'Contracts',
        params: {
          screen: 'ContractDetail',
          params: { uuid: contractUuid },
        },
      });
      return;
    }

    if (conversationUuid) {
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: { uuid: conversationUuid },
      });
      return;
    }

    navigation.navigate('Discover', {
      screen: 'Providers',
      params: { screen: 'ProvidersList' },
    });
  }

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
        {mode === 'offer' ? 'Send contract offer' : 'Contact provider'}
      </Text>
      <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
        {mode === 'offer'
          ? 'Create the lead, open a private thread, and send an offer the provider can accept.'
          : 'Send an inquiry to create a lead and private conversation with the provider.'}
      </Text>

      <View style={{ marginTop: spacing.xl }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <ModeChip label="Message" active={mode === 'message'} onPress={() => setMode('message')} />
          <ModeChip label="Contract offer" active={mode === 'offer'} onPress={() => setMode('offer')} />
        </View>
        <AppInput label="Service type" value={serviceType} onChangeText={setServiceType} placeholder="Service type" />
        <AppInput
          label={mode === 'offer' ? 'Offer details' : 'Message (optional)'}
          value={message}
          onChangeText={setMessage}
          placeholder={
            mode === 'offer'
              ? 'Describe the work, timeline, and what you are offering…'
              : 'Tell the provider what you need, or leave this empty to start the conversation'
          }
          autoCapitalize="sentences"
        />
        {mode === 'offer' ? (
          <AppInput
            label="Offered rate (optional)"
            value={offeredRate}
            onChangeText={setOfferedRate}
            placeholder="e.g. 150"
            keyboardType="numeric"
          />
        ) : null}

        <Text style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
          Urgency: {urgency}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['low', 'normal', 'high', 'urgent'] as const).map((u) => (
            <AppButton
              key={u}
              title={u}
              onPress={() => setUrgency(u)}
              variant={u === urgency ? 'primary' : 'ghost'}
              style={{ flex: 1, paddingHorizontal: 0 }}
            />
          ))}
        </View>

        {!!error && <Text style={{ marginTop: spacing.md, color: colors.danger }}>{error}</Text>}

        <AppButton
          title={mode === 'offer' ? 'Send offer' : 'Send inquiry'}
          onPress={onSubmit}
          loading={submitting}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </AppScreen>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: active ? colors.primary[600] : colors.border,
        backgroundColor: active ? colors.primary[600] : colors.surface,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        style={{
          color: active ? colors.text.inverse : colors.text.primary,
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

