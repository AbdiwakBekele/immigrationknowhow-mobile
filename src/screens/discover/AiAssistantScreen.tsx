import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as aiApi from '../../api/aiAssistantApi';
import { purchaseAiAssistantSubscription } from '../../services/appleIapService';
import { shouldUseAppleIap } from '../../utils/platformPayments';
import type { ChatMessage } from '../../api/aiAssistantApi';
import { setAiAssistantFabSuppressed } from '../../navigation/aiAssistantFabVisibility';
import type { StripeCheckoutParams } from '../onboarding/StripeCheckoutScreen';

type LocalMessage = ChatMessage & { pending?: boolean };

/** Must match Laravel validation on POST /api/mobile/ai-assistant/ask */
const MIN_QUESTION_LENGTH = 6;

type AiAssistantNav = NativeStackNavigationProp<{
  StripeCheckout: StripeCheckoutParams;
}>;

export function AiAssistantScreen() {
  const navigation = useNavigation<AiAssistantNav>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<aiApi.AiAssistantState | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const listRef = useRef<FlatList<LocalMessage>>(null);

  const load = async () => {
    setLoading(true);
    const res = await aiApi.getAiAssistant();
    setLoading(false);
    if (res.success) {
      setState(res.data.state);
      setMessages(res.data.state.chat_messages ?? []);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setAiAssistantFabSuppressed(true);
      void load();

      return () => setAiAssistantFabSuppressed(false);
    }, []),
  );

  const subscribe = async () => {
    setErr(null);
    setSubscribing(true);
    try {
      if (shouldUseAppleIap()) {
        const productId =
          (typeof state?.apple_product_id === 'string' && state.apple_product_id) ||
          'com.immigrantknowhow.ikhapp.monthly.ai_assistant';
        await purchaseAiAssistantSubscription(productId);
        await load();
        return;
      }

      const res = await aiApi.checkoutAiAssistant();
      if (!res.success) {
        setErr(res.message);
        return;
      }
      if (res.data.already_subscribed) {
        const nextState = res.data.state ?? (await aiApi.getAiAssistant()).data?.state;
        if (nextState) {
          setState(nextState);
          setMessages(nextState.chat_messages ?? []);
        }
        return;
      }
      const url = res.data.checkout_url;
      if (url) {
        navigation.navigate('StripeCheckout', {
          checkoutUrl: url,
          variant: 'aiAssistant',
          checkoutSessionId: res.data.checkout_session_id || undefined,
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Subscription could not be completed.');
    } finally {
      setSubscribing(false);
    }
  };

  const send = async () => {
    const q = input.trim();
    if (q.length < MIN_QUESTION_LENGTH || sending) return;

    const userMsg: LocalMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      text: q,
      ts: new Date().toISOString(),
    };
    const thinkingMsg: LocalMessage = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      text: '',
      ts: null,
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setSending(true);
    setErr(null);

    const res = await aiApi.askAiAssistant(q);
    setSending(false);

    if (!res.success) {
      setMessages((prev) => prev.filter((m) => !m.pending));
      setErr(res.message);
      return;
    }

    const assistantMsg: LocalMessage = {
      id: `resp-${Date.now()}`,
      role: 'assistant',
      text: typeof res.data.answer === 'string' ? res.data.answer : '',
      ts: new Date().toISOString(),
    };
    setMessages((prev) => prev.map((m) => (m.pending ? assistantMsg : m)));
  };

  if (loading) {
    return (
      <AppScreen style={styles.center}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const active = state?.is_addon_active;

  if (!active) {
    return (
      <AppScreen style={styles.gateScreen}>
        <View style={styles.gateCard}>
          <Ionicons name="sparkles" size={40} color={colors.primary[600]} />
          <Text style={styles.gateTitle}>AI Assistant</Text>
          <Text style={styles.gateBody}>
            Get instant answers about immigration programs, USCIS processes, and more. One subscription covers both
            service seeker and provider accounts.
          </Text>
          <Text style={styles.gatePrice}>
            {state?.currency ?? 'USD'} {state?.monthly_price ?? '4.99'} / month
          </Text>
          <Pressable onPress={() => void subscribe()} style={styles.gateCta} disabled={subscribing}>
            <Text style={styles.gateCtaText}>
              {subscribing ? 'Processing…' : shouldUseAppleIap() ? 'Subscribe with Apple' : 'Subscribe now'}
            </Text>
          </Pressable>
          {!!err && <Text style={styles.error}>{err}</Text>}
        </View>
      </AppScreen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="sparkles-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Ask me anything</Text>
            <Text style={styles.emptyBody}>
              Ask about immigration programs, USCIS processes, client education, library resources, or marketplace providers.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
              {!isUser && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={14} color={colors.primary[600]} />
                </View>
              )}
              <View style={[styles.bubbleContent, isUser ? styles.bubbleContentUser : styles.bubbleContentAi]}>
                {item.pending ? (
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.primary[600]} />
                    <Text style={styles.thinkingText}>Thinking…</Text>
                  </View>
                ) : (
                  <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {!!err && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{err}</Text>
        </View>
      )}

      <View style={[styles.inputRow, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Ask a question (at least ${MIN_QUESTION_LENGTH} characters)…`}
          placeholderTextColor={colors.text.tertiary}
          multiline
          style={styles.textInput}
          editable={!sending}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300)}
        />
        <Pressable
          onPress={() => {
            void send();
            Keyboard.dismiss();
          }}
          disabled={sending || input.trim().length < MIN_QUESTION_LENGTH}
          style={({ pressed }) => [
            styles.sendBtn,
            (sending || input.trim().length < MIN_QUESTION_LENGTH) && styles.sendBtnDisabled,
            pressed && styles.sendBtnPressed,
          ]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  bubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bubbleContent: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: '100%',
  },
  bubbleContentUser: {
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  bubbleContentAi: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    color: colors.text.primary,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    backgroundColor: '#f8fafc',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnPressed: {
    opacity: 0.8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: 80,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  gateScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  gateCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  gateTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  gateBody: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  gatePrice: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  gateCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: 14,
  },
  gateCtaText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
    textAlign: 'center',
  },
  errorBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fef2f2',
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
