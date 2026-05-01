import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { DrawerMenuButton } from '../../components/DrawerMenuButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as messagesApi from '../../api/messagesApi';
import type { MessagesStackParamList } from './MessagesStack';

export function MessagesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<messagesApi.ConversationItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await messagesApi.listConversations();
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setItems(res.data.conversations ?? []);
    })();
  }, []);

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <DrawerMenuButton />
        <Text
          style={{
            flex: 1,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Messages
        </Text>
      </View>

      {loading ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : error ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={{ marginTop: spacing.lg, color: colors.text.secondary }}>No conversations yet.</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(c) => c.uuid}
          renderItem={({ item }) => (
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
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {item.subject ?? 'Conversation'}
              </Text>
              {!!item.latest_message?.body && (
                <Text numberOfLines={1} style={{ marginTop: spacing.xs, color: colors.text.secondary }}>
                  {item.latest_message.body}
                </Text>
              )}
              <Text style={{ marginTop: spacing.xs, color: item.unread_count > 0 ? colors.primary[700] : colors.text.muted, fontSize: typography.fontSize.sm }}>
                {item.unread_count > 0 ? `${item.unread_count} unread` : ' '}
              </Text>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}

