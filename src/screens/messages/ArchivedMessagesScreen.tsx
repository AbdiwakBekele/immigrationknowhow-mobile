import React, { useCallback, useState } from 'react';
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

  const onRecover = async (uuid: string) => {
    setBusyUuid(uuid);
    const res = await messagesApi.unarchiveConversation(uuid);
    setBusyUuid(null);
    if (!res.success) {
      setError(res.message);
      return;
    }
    void load(false);
  };

  const onDelete = async (uuid: string) => {
    setBusyUuid(uuid);
    const res = await messagesApi.deleteConversation(uuid);
    setBusyUuid(null);
    if (!res.success) {
      setError(res.message);
      return;
    }
    void load(false);
  };

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No archived threads.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(c) => c.uuid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => {
            const title = counterpartName(role, item);
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
                {!!item.latest_message?.body && (
                  <Text numberOfLines={2} style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
                    {item.latest_message.body}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Pressable
                    disabled={busyUuid === item.uuid}
                    onPress={() => void onRecover(item.uuid)}
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
                      Recover
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busyUuid === item.uuid}
                    onPress={() => void onDelete(item.uuid)}
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
                      Delete
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
