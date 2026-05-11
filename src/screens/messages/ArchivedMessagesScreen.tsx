import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
import { formatConversationListTime, fullName, leadStatusLabel, leadStatusStyle } from '../../utils/providerUi';
import type { MessagesStackParamList } from './MessagesStack';

function counterpartName(role: string | null | undefined, item: messagesApi.ConversationItem): string {
  if (role === 'provider') return fullName(item.user);
  return fullName(item.provider_user) || (item.subject ?? '').trim() || 'Conversation';
}

type ConversationGroup = {
  key: string;
  title: string;
  latest: messagesApi.ConversationItem;
  conversations: messagesApi.ConversationItem[];
};

function conversationTimestamp(item: messagesApi.ConversationItem): number {
  const raw = item.last_message_at ?? item.latest_message?.created_at ?? null;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function counterpartKey(role: string | null | undefined, item: messagesApi.ConversationItem): string {
  const participant = role === 'provider' ? item.user : item.provider_user;
  const prefix = role === 'provider' ? 'user' : 'provider';
  if (participant?.id != null) {
    return `${prefix}:${participant.id}`;
  }
  return `${prefix}:name:${counterpartName(role, item).trim().toLowerCase()}`;
}

function groupConversations(role: string | null | undefined, items: messagesApi.ConversationItem[]): ConversationGroup[] {
  const grouped = new Map<string, ConversationGroup>();

  for (const item of items) {
    const key = counterpartKey(role, item);
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        key,
        title: counterpartName(role, item),
        latest: item,
        conversations: [item],
      });
      continue;
    }

    current.conversations.push(item);
    if (conversationTimestamp(item) > conversationTimestamp(current.latest)) {
      current.latest = item;
      current.title = counterpartName(role, item);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => conversationTimestamp(b.latest) - conversationTimestamp(a.latest));
}

export function ArchivedMessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<messagesApi.ConversationItem[]>([]);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await messagesApi.listArchivedConversations();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setItems(res.data.conversations ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const onRecover = async (group: ConversationGroup) => {
    setBusyUuid(group.key);
    for (const conversation of group.conversations) {
      const res = await messagesApi.unarchiveConversation(conversation.uuid);
      if (!res.success) {
        setBusyUuid(null);
        setError(res.message);
        return;
      }
    }
    setBusyUuid(null);
    void load(false);
  };

  const onDelete = async (group: ConversationGroup) => {
    setBusyUuid(group.key);
    for (const conversation of group.conversations) {
      const res = await messagesApi.deleteConversation(conversation.uuid);
      if (!res.success) {
        setBusyUuid(null);
        setError(res.message);
        return;
      }
    }
    setBusyUuid(null);
    void load(false);
  };

  const groupedItems = useMemo(() => groupConversations(role, items), [items, role]);

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : groupedItems.length === 0 ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No archived threads.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={groupedItems}
          keyExtractor={(group) => group.key}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item: group }) => {
            const item = group.latest;
            const title = group.title;
            const st = leadStatusStyle(item.lead?.status);
            return (
              <Pressable
                onPress={() => navigation.navigate('Chat', { uuid: item.uuid })}
                style={{
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, flex: 1 }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted, marginLeft: spacing.sm }}>
                    {formatConversationListTime(item.last_message_at)}
                  </Text>
                </View>
                {item.lead && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs, alignItems: 'center' }}>
                    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.backgroundMuted }}>
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                        {item.lead.service_type_label || item.lead.service_type}
                      </Text>
                    </View>
                    {!!item.lead.status && (
                      <View
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: st.bg,
                          borderWidth: 1,
                          borderColor: st.border,
                        }}
                      >
                        <Text style={{ fontSize: typography.fontSize.xs, color: st.text, textTransform: 'lowercase' }}>
                          {leadStatusLabel(item.lead.status)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {group.conversations.length > 1 && (
                  <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                    {group.conversations.length} archived inquiries with this {role === 'provider' ? 'client' : 'provider'}
                  </Text>
                )}
                {!!item.latest_message?.body && (
                  <Text numberOfLines={2} style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
                    {item.latest_message.body}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Pressable
                    disabled={busyUuid === group.key}
                    onPress={() => void onRecover(group)}
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#bfdbfe',
                      backgroundColor: '#eff6ff',
                    }}
                  >
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
                      {group.conversations.length > 1 ? 'Recover all' : 'Recover'}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busyUuid === group.key}
                    onPress={() => void onDelete(group)}
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#fecaca',
                      backgroundColor: '#fef2f2',
                    }}
                  >
                    <Text style={{ fontSize: typography.fontSize.xs, color: '#b91c1c', fontWeight: typography.fontWeight.medium }}>
                      {group.conversations.length > 1 ? 'Delete all' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </AppScreen>
  );
}
