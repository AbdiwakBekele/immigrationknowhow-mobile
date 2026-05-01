import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeadsListScreen } from './LeadsListScreen';
import { LeadDetailScreen } from './LeadDetailScreen';
import { ChatScreen } from '../messages/ChatScreen';

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetail: { uuid: string };
  Chat: { uuid: string };
};

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export function LeadsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeadsList" component={LeadsListScreen} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
