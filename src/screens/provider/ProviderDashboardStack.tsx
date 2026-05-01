import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderDashboardScreen } from './ProviderDashboardScreen';
import { ProviderNotificationsScreen } from './ProviderNotificationsScreen';

export type ProviderDashboardStackParamList = {
  ProviderDashboardHome: undefined;
  ProviderNotifications: undefined;
};

const Stack = createNativeStackNavigator<ProviderDashboardStackParamList>();

export function ProviderDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProviderDashboardHome" component={ProviderDashboardScreen} />
      <Stack.Screen name="ProviderNotifications" component={ProviderNotificationsScreen} />
    </Stack.Navigator>
  );
}
