import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import type { SeekerBottomTabParamList } from '../../navigation/SeekerBottomTabs';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as contractsApi from '../../api/contractsApi';
import * as messagesApi from '../../api/messagesApi';
import type { MessagesStackParamList } from './MessagesStack';
import { formatConversationListTime, fullName, leadStatusLabel, leadStatusStyle } from '../../utils/providerUi';

type ChatRoute = RouteProp<MessagesStackParamList, 'Chat'>;
type ChatNav = CompositeNavigationProp<
  NativeStackNavigationProp<MessagesStackParamList, 'Chat'>,
  BottomTabNavigationProp<SeekerBottomTabParamList>
>;

type Row = { type: 'date'; key: string; label: string } | { type: 'msg'; key: string; item: messagesApi.MessageItem };

function formatDateDivider(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function participantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : parts[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase() || '?';
}

export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const navigation = useNavigation<ChatNav>();
  const { role } = useAuth();
  const { uuid } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<messagesApi.ConversationItem | null>(null);
  const [messages, setMessages] = useState<messagesApi.MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [offerRate, setOfferRate] = useState('');
  const [contractBusy, setContractBusy] = useState(false);

  const loadConversation = useCallback(
    async (first = false) => {
      if (first) setLoading(true);
      const res = await messagesApi.getConversation(uuid);
      if (first) setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setError(null);
      setConversation(res.data.conversation ?? null);
      setMessages(res.data.messages ?? []);
    },
    [uuid]
  );

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    void loadConversation(true);
    timer = setInterval(() => {
      void loadConversation(false);
    }, 5000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loadConversation]);

  const rows = useMemo<Row[]>(() => {
    const output: Row[] = [];
    let lastDateKey = '';
    for (const msg of messages) {
      const dateKey = new Date(msg.created_at || '').toDateString();
      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        output.push({ type: 'date', key: `d-${msg.uuid}`, label: formatDateDivider(msg.created_at) });
      }
      output.push({ type: 'msg', key: msg.uuid, item: msg });
    }
    return output;
  }, [messages]);

  async function onSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setSending(true);
    setError(null);
    const res = await messagesApi.sendMessage(uuid, body);
    setSending(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMessages((prev) => [...prev, res.data.message]);
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            last_message_at: res.data.message.created_at ?? prev.last_message_at,
            latest_message: {
              body: res.data.message.body,
              created_at: res.data.message.created_at ?? prev.latest_message?.created_at ?? null,
            },
          }
        : prev
    );
  }

  async function onSendContractOffer() {
    const leadUuid = conversation?.lead?.uuid;
    if (role !== 'user' || !leadUuid) return;

    const normalizedRate = offerRate.trim();
    if (normalizedRate) {
      const parsed = Number(normalizedRate);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Enter a valid offer rate or leave it blank.');
        return;
      }
    }

    setContractBusy(true);
    setError(null);
    const res = await contractsApi.sendContract(leadUuid, normalizedRate ? Number(normalizedRate) : undefined);
    setContractBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setOfferRate('');
    const contractUuid = res.data.contract_uuid ?? conversation?.lead?.contract_uuid ?? null;
    await loadConversation(false);

    if (contractUuid) {
      navigation.navigate('Discover', {
        screen: 'Contracts',
        params: {
          screen: 'ContractDetail',
          params: { uuid: contractUuid },
        },
      });
    }
  }

  function openContract(contractUuid: string) {
    navigation.navigate('Discover', {
      screen: 'Contracts',
      params: {
        screen: 'ContractDetail',
        params: { uuid: contractUuid },
      },
    });
  }

  const participant = role === 'provider' ? fullName(conversation?.user) : fullName(conversation?.provider_user);
  const headerTitle = participant || 'Chat';

  useLayoutEffect(() => {
    navigation.setOptions({ title: headerTitle });
  }, [navigation, headerTitle]);

  const leadStatus = conversation?.lead?.status;
  const leadPill = leadStatusStyle(leadStatus);
  const leadContractUuid = conversation?.lead?.contract_uuid ?? null;
  const canSendOffer =
    role === 'user' &&
    !!conversation?.lead?.uuid &&
    !conversation?.lead?.contract_sent_at &&
    !conversation?.lead?.contract_accepted_at &&
    ['new', 'contacted'].includes((leadStatus ?? '').toLowerCase());
  const contractStateText = conversation?.lead?.contract_accepted_at
    ? 'Contract accepted'
    : conversation?.lead?.contract_sent_at
      ? 'Contract offer pending'
      : '';

  if (loading) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading conversation…</Text>
      </AppScreen>
    );
  }

  if (error && !conversation) {
    return (
      <AppScreen variant="gradient" style={styles.centered}>
        <View style={styles.fullErrorCard}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
          <Text style={styles.fullErrorTitle}>Unable to open chat</Text>
          <Text style={styles.fullErrorText}>{error}</Text>
          <Pressable onPress={() => void loadConversation(true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <View style={styles.threadCard}>
          <View style={styles.threadTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{participantInitials(participant)}</Text>
            </View>
            <View style={styles.threadTextWrap}>
              <Text style={styles.participantName}>{participant}</Text>
              <Text style={styles.threadSubtitle}>Secure one-on-one conversation linked to a service inquiry.</Text>
            </View>
            <Pressable style={styles.infoToggle} onPress={() => setMetaOpen((value) => !value)}>
              <Ionicons name={metaOpen ? 'chevron-up' : 'information-circle-outline'} size={18} color={colors.primary[700]} />
              <Text style={styles.infoToggleText}>{metaOpen ? 'Hide info' : 'Lead info'}</Text>
            </Pressable>
          </View>

          <View style={styles.chipRow}>
            {!!conversation?.lead?.service_type && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>{conversation.lead.service_type}</Text>
              </View>
            )}
            {!!leadStatus && (
              <View style={[styles.infoChip, { backgroundColor: leadPill.bg, borderWidth: 1, borderColor: leadPill.border }]}>
                <Text style={[styles.infoChipText, { color: leadPill.text }]}>{leadStatusLabel(leadStatus)}</Text>
              </View>
            )}
            {!!conversation?.last_message_at && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>Last active {formatConversationListTime(conversation.last_message_at)}</Text>
              </View>
            )}
          </View>

          {metaOpen && (
            <View style={styles.metaPanel}>
              <Text style={styles.metaText}>Only this client and provider can see this conversation thread.</Text>
              {!!contractStateText && <Text style={styles.contractStateText}>{contractStateText}</Text>}
              {role === 'user' && (canSendOffer || !!leadContractUuid) ? (
                <View style={styles.contractActionWrap}>
                  {canSendOffer ? (
                    <>
                      <AppInput
                        label="Offer rate (optional)"
                        value={offerRate}
                        onChangeText={setOfferRate}
                        placeholder="e.g. 150"
                        keyboardType="numeric"
                      />
                      <AppButton title="Send contract offer" onPress={() => void onSendContractOffer()} loading={contractBusy} variant="secondary" />
                    </>
                  ) : null}
                  {!!leadContractUuid && (
                    <AppButton
                      title={conversation?.lead?.contract_accepted_at ? 'Open contract' : 'Open offer'}
                      onPress={() => openContract(leadContractUuid)}
                      variant="ghost"
                    />
                  )}
                </View>
              ) : null}
            </View>
          )}
        </View>

        {!!error && (
          <View style={styles.inlineErrorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.inlineErrorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          style={styles.messageList}
          contentContainerStyle={[styles.messageListContent, rows.length === 0 && styles.messageListEmpty]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyMessagesWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={46} color={colors.text.muted} />
              <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
              <Text style={styles.emptyMessagesText}>Send the first message to start this conversation.</Text>
            </View>
          }
          renderItem={({ item }) =>
            item.type === 'date' ? (
              <View style={styles.dateWrap}>
                <Text style={styles.dateText}>{item.label}</Text>
              </View>
            ) : (
              <View style={[styles.bubbleRow, item.item.is_mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                <View style={[styles.bubble, item.item.is_mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, item.item.is_mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{item.item.body}</Text>
                  <Text style={[styles.bubbleTime, item.item.is_mine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
                    {formatConversationListTime(item.item.created_at)}
                  </Text>
                </View>
              </View>
            )
          }
        />

        <View style={styles.composerBar}>
          <View style={styles.composerInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              style={styles.composerInput}
            />
          </View>
          <Pressable
            onPress={onSend}
            disabled={sending || !draft.trim()}
            style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
          >
            {sending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={18} color={colors.text.inverse} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  fullErrorCard: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.softLg,
  },
  fullErrorTitle: {
    marginTop: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  fullErrorText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  threadCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.softLg,
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  threadTextWrap: {
    flex: 1,
  },
  participantName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  threadSubtitle: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoToggleText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  infoChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.backgroundMuted,
  },
  infoChipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  metaPanel: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  contractStateText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  contractActionWrap: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  inlineErrorBanner: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  inlineErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  messageList: {
    flex: 1,
    marginTop: spacing.md,
  },
  messageListContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  messageListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyMessagesWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyMessagesTitle: {
    marginTop: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyMessagesText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dateWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  bubbleRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.primary[600],
    borderTopRightRadius: 8,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 8,
    ...shadows.soft,
  },
  bubbleText: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: colors.text.inverse,
  },
  bubbleTextOther: {
    color: colors.text.primary,
  },
  bubbleTime: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    textAlign: 'right',
  },
  bubbleTimeMine: {
    color: '#DBEAFE',
  },
  bubbleTimeOther: {
    color: colors.text.muted,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  composerInputWrap: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  composerInput: {
    minHeight: 24,
    maxHeight: 120,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    ...shadows.soft,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
