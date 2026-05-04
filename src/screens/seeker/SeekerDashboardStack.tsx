import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SeekerDashboardScreen } from './SeekerDashboardScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { AppHeader } from '../../components/navigation/AppHeader';

export type SeekerDashboardStackParamList = {
  SeekerDashboardHome: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<SeekerDashboardStackParamList>();

export function SeekerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="SeekerDashboardHome" component={SeekerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

