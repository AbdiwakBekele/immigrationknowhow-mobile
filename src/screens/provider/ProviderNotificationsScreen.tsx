import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as notificationsApi from '../../api/providerNotificationsApi';

export function ProviderNotificationsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<notificationsApi.ProviderNotificationRow[]>([]);
  const [missingTable, setMissingTable] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await notificationsApi.listProviderNotifications();
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMissingTable(res.data.payload.notifications_table_missing);
    setRows(res.data.payload.notifications.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const markRead = async (id: string) => {
    const res = await notificationsApi.markProviderNotificationRead(id);
    if (res.success) void load();
  };

  const markAll = async () => {
    const res = await notificationsApi.markAllProviderNotificationsRead();
    if (res.success) void load();
  };

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
        Notifications
      </Text>

      {!missingTable && rows.some((r) => !r.read_at) && (
        <Pressable onPress={() => void markAll()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Mark all read</Text>
        </Pressable>
      )}

      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : missingTable ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>Notifications are not available on this server.</Text>
      ) : rows.length === 0 ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No notifications.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: item.read_at ? colors.surface : colors.primary[50],
              }}
            >
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{item.type}</Text>
              <Text style={{ marginTop: spacing.sm, color: colors.text.primary }}>
                {summarizeNotification(item.data)}
              </Text>
              <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                {item.created_at}
              </Text>
              {!item.read_at && (
                <Pressable onPress={() => void markRead(item.id)} style={{ marginTop: spacing.md }}>
                  <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Mark read</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </AppScreen>
  );
}

function summarizeNotification(data: Record<string, unknown>): string {
  if (typeof data.message === 'string') return data.message;
  if (typeof data.title === 'string') return data.title;
  try {
    return JSON.stringify(data).slice(0, 200);
  } catch {
    return 'Notification';
  }
}
