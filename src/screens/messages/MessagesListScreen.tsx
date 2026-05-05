import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
import type { MessagesStackParamList } from './MessagesStack';
import { formatConversationListTime, fullName, leadStatusLabel, leadStatusStyle } from '../../utils/providerUi';

function counterpartName(role: string | null | undefined, item: messagesApi.ConversationItem): string {
  if (role === 'provider') return fullName(item.user);
  return fullName(item.provider_user) || (item.subject ?? '').trim() || 'Conversation';
}

export function MessagesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<messagesApi.ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const [listRes, unreadRes] = await Promise.all([messagesApi.listConversations(), messagesApi.unreadCount()]);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!listRes.success) {
      setError(listRes.message);
      return;
    }
    setItems(listRes.data.conversations ?? []);
    if (unreadRes.success) setUnreadTotal(unreadRes.data.count ?? 0);
  }, []);

  const runConversationAction = useCallback(
    async (uuid: string, action: 'read' | 'archive') => {
      setBusyUuid(uuid);
      const res = action === 'read' ? await messagesApi.markConversationRead(uuid) : await messagesApi.archiveConversation(uuid);
      setBusyUuid(null);
      if (!res.success) {
        setError(res.message);
        return;
      }
      void load(false);
    },
    [load]
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => counterpartName(role, c).toLowerCase().includes(q));
  }, [items, search, role]);

  const headerSubtitle =
    role === 'provider'
      ? unreadTotal > 0
        ? `${unreadTotal} unread — clients who contacted you appear here.`
        : 'All caught up. Threads are tied to service inquiries.'
      : unreadTotal > 0
        ? `${unreadTotal} unread message${unreadTotal > 1 ? 's' : ''}`
        : 'All caught up.';

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      {loading && !refreshing ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.sm }}
          data={filtered}
          keyExtractor={(c) => c.uuid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Messaging
              </Text>
              <Text
                style={{
                  marginTop: spacing.xs,
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {role === 'provider' ? 'Client messages' : 'Messages'}
              </Text>
              <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>{headerSubtitle}</Text>
              <View style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={role === 'provider' ? 'Search by client name…' : 'Search by name…'}
                  placeholderTextColor={colors.text.muted}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                  }}
                />
                <Pressable
                  onPress={() => navigation.navigate('ArchivedMessages')}
                  style={{
                    minHeight: 48,
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#bfdbfe',
                    backgroundColor: '#eff6ff',
                  }}
                >
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.primary[700] }}>
                    Archived
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={{ color: colors.text.secondary, paddingBottom: spacing['2xl'] }}>
              {search.trim() ? 'No threads match your search.' : 'No conversations yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const title = counterpartName(role, item);
            const st = leadStatusStyle(item.lead?.status);
            const bold = (item.unread_count ?? 0) > 0;
            const initials = title
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((x) => x[0]?.toUpperCase() ?? '')
              .join('');
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
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.backgroundMuted,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginRight: spacing.md,
                    }}
                  >
                    <Text style={{ color: colors.text.secondary, fontWeight: typography.fontWeight.semibold }}>{initials || '?'}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text
                      style={{
                        fontWeight: bold ? typography.fontWeight.bold : typography.fontWeight.semibold,
                        color: colors.text.primary,
                      }}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
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
                    {!!item.latest_message?.body && (
                      <Text
                        numberOfLines={2}
                        style={{
                          marginTop: spacing.sm,
                          color: bold ? colors.text.primary : colors.text.secondary,
                        }}
                      >
                        {item.latest_message.body}
                      </Text>
                    )}
                    {(item.unread_count ?? 0) > 0 && (
                      <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs, color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
                        {item.unread_count! > 9 ? '9+' : item.unread_count} unread
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                      <Pressable
                        disabled={busyUuid === item.uuid}
                        onPress={() => void runConversationAction(item.uuid, 'read')}
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#a7f3d0',
                          backgroundColor: '#ecfdf5',
                        }}
                      >
                        <Text style={{ fontSize: typography.fontSize.xs, color: '#047857', fontWeight: typography.fontWeight.medium }}>Mark read</Text>
                      </Pressable>
                      <Pressable
                        disabled={busyUuid === item.uuid}
                        onPress={() => void runConversationAction(item.uuid, 'archive')}
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#fde68a',
                          backgroundColor: '#fffbeb',
                        }}
                      >
                        <Text style={{ fontSize: typography.fontSize.xs, color: '#a16207', fontWeight: typography.fontWeight.medium }}>Archive</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                    {formatConversationListTime(item.last_message_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </AppScreen>
  );
}
