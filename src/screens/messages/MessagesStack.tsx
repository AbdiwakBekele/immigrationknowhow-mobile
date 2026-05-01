import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesListScreen } from './MessagesListScreen';
import { ChatScreen } from './ChatScreen';

export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { uuid: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesList" component={MessagesListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

