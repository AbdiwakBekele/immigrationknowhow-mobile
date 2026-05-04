import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
import { formatConversationListTime, fullName, leadStatusLabel, leadStatusStyle } from '../../utils/providerUi';
type ChatRoute = RouteProp<{ Chat: { uuid: string } }, 'Chat'>;

type Row = { type: 'date'; key: string; label: string } | { type: 'msg'; key: string; item: messagesApi.MessageItem };

function formatDateDivider(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { uuid } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<messagesApi.ConversationItem | null>(null);
  const [messages, setMessages] = useState<messagesApi.MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const fetchConversation = async (first = false) => {
      const res = await messagesApi.getConversation(uuid);
      if (first) setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setConversation(res.data.conversation ?? null);
      setMessages(res.data.messages ?? []);
    };
    void fetchConversation(true);
    timer = setInterval(() => {
      void fetchConversation(false);
    }, 5000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [uuid]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDateKey = '';
    for (const msg of messages) {
      const dateKey = new Date(msg.created_at || '').toDateString();
      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        out.push({ type: 'date', key: `d-${msg.uuid}`, label: formatDateDivider(msg.created_at) });
      }
      out.push({ type: 'msg', key: msg.uuid, item: msg });
    }
    return out;
  }, [messages]);

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

  const leadStatus = conversation?.lead?.status;
  const leadPill = leadStatusStyle(leadStatus);
  const participant = fullName(conversation?.user);

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
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{participant}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' }}>
              {!!conversation?.lead?.service_type && (
                <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.backgroundMuted }}>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>{conversation.lead.service_type}</Text>
                </View>
              )}
              {!!leadStatus && (
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: leadPill.bg,
                    borderWidth: 1,
                    borderColor: leadPill.border,
                  }}
                >
                  <Text style={{ fontSize: typography.fontSize.xs, color: leadPill.text }}>{leadStatusLabel(leadStatus)}</Text>
                </View>
              )}
              {!!conversation?.last_message_at && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                  Last: {formatConversationListTime(conversation.last_message_at)}
                </Text>
              )}
              <Pressable onPress={() => setMetaOpen((v) => !v)} style={{ marginLeft: 'auto' }}>
                <Text style={{ color: colors.primary[700], fontSize: typography.fontSize.xs }}>
                  {metaOpen ? 'Hide info' : 'Lead info'}
                </Text>
              </Pressable>
            </View>
            {metaOpen && (
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                One-on-one thread linked to a service inquiry. Only this client and provider can see this conversation.
              </Text>
            )}
          </View>
          <FlatList
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['3xl'] }}
            data={rows}
            keyExtractor={(r) => r.key}
            renderItem={({ item }) =>
              item.type === 'date' ? (
                <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{item.label}</Text>
                </View>
              ) : (
                <View style={{ alignItems: item.item.is_mine ? 'flex-end' : 'flex-start', marginBottom: spacing.md }}>
                  <View
                    style={{
                      maxWidth: '85%',
                      backgroundColor: item.item.is_mine ? colors.primary[600] : colors.surface,
                      borderColor: item.item.is_mine ? colors.primary[600] : colors.border,
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: spacing.md,
                    }}
                  >
                    <Text style={{ color: item.item.is_mine ? colors.text.inverse : colors.text.primary, fontSize: typography.fontSize.md }}>
                      {item.item.body}
                    </Text>
                    <Text
                      style={{
                        marginTop: spacing.xs,
                        fontSize: typography.fontSize.xs,
                        color: item.item.is_mine ? '#dbeafe' : colors.text.muted,
                        textAlign: 'right',
                      }}
                    >
                      {formatConversationListTime(item.item.created_at)}
                    </Text>
                  </View>
                </View>
              )
            }
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

