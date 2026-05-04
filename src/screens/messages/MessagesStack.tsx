import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesListScreen } from './MessagesListScreen';
import { ChatScreen } from './ChatScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { ArchivedMessagesScreen } from './ArchivedMessagesScreen';

export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { uuid: string };
  ArchivedMessages: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="MessagesList" component={MessagesListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="ArchivedMessages" component={ArchivedMessagesScreen} options={{ title: 'Archived' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

