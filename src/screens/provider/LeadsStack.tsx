import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeadsListScreen } from './LeadsListScreen';
import { LeadDetailScreen } from './LeadDetailScreen';
import { ChatScreen } from '../messages/ChatScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetail: { uuid: string };
  Chat: { uuid: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export function LeadsStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="LeadsList" component={LeadsListScreen} options={{ title: 'Leads' }} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: 'Lead details' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
