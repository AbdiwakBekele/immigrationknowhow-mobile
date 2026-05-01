import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
type ChatRoute = RouteProp<{ Chat: { uuid: string } }, 'Chat'>;

export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { uuid } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<messagesApi.MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const sorted = useMemo(() => messages, [messages]);

  useEffect(() => {
    (async () => {
      const res = await messagesApi.getConversation(uuid);
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setMessages(res.data.messages ?? []);
    })();
  }, [uuid]);

  async function onSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setSending(true);
    const res = await messagesApi.sendMessage(uuid, body);
    setSending(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMessages((prev) => [...prev, res.data.message]);
  }

  return (
    <AppScreen style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center' }}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['3xl'] }}
            data={sorted}
            keyExtractor={(m) => m.uuid}
            renderItem={({ item }) => (
              <View style={{ alignItems: item.is_mine ? 'flex-end' : 'flex-start', marginBottom: spacing.md }}>
                <View
                  style={{
                    maxWidth: '85%',
                    backgroundColor: item.is_mine ? colors.primary[600] : colors.surface,
                    borderColor: item.is_mine ? colors.primary[600] : colors.border,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ color: item.is_mine ? colors.text.inverse : colors.text.primary, fontSize: typography.fontSize.md }}>
                    {item.body}
                  </Text>
                </View>
              </View>
            )}
          />

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              placeholderTextColor={colors.text.muted}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.text.primary,
              }}
            />
            <Pressable
              onPress={onSend}
              disabled={sending}
              style={{
                backgroundColor: colors.primary[600],
                paddingHorizontal: spacing.lg,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>
                Send
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </AppScreen>
  );
}

