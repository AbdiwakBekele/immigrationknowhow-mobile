import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as aiApi from '../../api/aiAssistantApi';

export function AiAssistantScreen() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<aiApi.AiAssistantState | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await aiApi.getAiAssistant();
    setLoading(false);
    if (res.success) setState(res.data.state);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const subscribe = async () => {
    setErr(null);
    const res = await aiApi.checkoutAiAssistant();
    if (!res.success) {
      setErr(res.message);
      return;
    }
    const url = res.data.checkout_url;
    if (url) await Linking.openURL(url);
  };

  const ask = async () => {
    setBusy(true);
    setErr(null);
    setAnswer(null);
    const res = await aiApi.askAiAssistant(question.trim());
    setBusy(false);
    if (!res.success) {
      setErr(res.message);
      return;
    }
    setAnswer(typeof res.data.answer === 'string' ? res.data.answer : '');
  };

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const active = state?.is_addon_active;

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          AI Assistant
        </Text>
        <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
          {active ? 'Subscription active.' : `Add-on: ${state?.monthly_price ?? ''} ${state?.currency ?? ''}/month`}
        </Text>
        {!active && (
          <Pressable onPress={() => void subscribe()} style={{ marginTop: spacing.lg }}>
            <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Subscribe via Stripe</Text>
          </Pressable>
        )}
        {!!err && <Text style={{ marginTop: spacing.md, color: colors.danger }}>{err}</Text>}
        <Text style={{ marginTop: spacing['2xl'], fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>Ask</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Your question (min 6 characters)"
          multiline
          style={{
            marginTop: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: spacing.md,
            minHeight: 100,
            color: colors.text.primary,
            textAlignVertical: 'top',
          }}
        />
        <Pressable
          onPress={() => void ask()}
          disabled={busy || question.trim().length < 6}
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.primary[600],
            paddingVertical: spacing.md,
            borderRadius: 12,
            opacity: busy || question.trim().length < 6 ? 0.5 : 1,
          }}
        >
          <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>
            {busy ? 'Thinking…' : 'Send'}
          </Text>
        </Pressable>
        {!!answer && (
          <Text style={{ marginTop: spacing.xl, color: colors.text.primary, lineHeight: 22 }}>{answer}</Text>
        )}
      </ScrollView>
    </AppScreen>
  );
}
