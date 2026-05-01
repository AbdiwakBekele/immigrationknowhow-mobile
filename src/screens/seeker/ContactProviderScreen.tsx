import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as providersApi from '../../api/providersApi';
import * as leadsApi from '../../api/leadsApi';
import type { ProvidersStackParamList } from './ProvidersStack';

type R = RouteProp<ProvidersStackParamList, 'ContactProvider'>;

export function ContactProviderScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<NativeStackNavigationProp<ProvidersStackParamList>>();
  const { slug } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceType, setServiceType] = useState('');
  const [message, setMessage] = useState('');
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
    if (!serviceType.trim() || !message.trim()) {
      setError('Please choose a service type and write a message.');
      return;
    }
    setSubmitting(true);
    const res = await leadsApi.createLead(slug, {
      service_type: serviceType.trim(),
      message: message.trim(),
      urgency,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    navigation.popToTop();
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
        Contact provider
      </Text>
      <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
        Send an inquiry (creates a lead + conversation, same as the web dashboard).
      </Text>

      <View style={{ marginTop: spacing.xl }}>
        <AppInput label="Service type" value={serviceType} onChangeText={setServiceType} placeholder="Service type" />
        <AppInput label="Message" value={message} onChangeText={setMessage} placeholder="Tell the provider what you need…" autoCapitalize="sentences" />

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

        <AppButton title="Send inquiry" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.xl }} />
      </View>
    </AppScreen>
  );
}

