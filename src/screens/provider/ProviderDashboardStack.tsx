import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderDashboardScreen } from './ProviderDashboardScreen';
import { ProviderNotificationsScreen } from './ProviderNotificationsScreen';
import { ProviderHubStack } from '../discover/ProviderHubStack';
import { ProviderSubscriptionsScreen } from './ProviderSubscriptionsScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { ProviderAnalyticsScreen } from './ProviderAnalyticsScreen';
import { ProviderBackgroundCheckScreen } from './ProviderBackgroundCheckScreen';

export type ProviderDashboardStackParamList = {
  ProviderDashboardHome: undefined;
  ProviderNotifications: undefined;
  ProviderHub: undefined;
  ProviderSubscription: undefined;
  ProviderAnalytics: undefined;
  ProviderBackgroundCheck: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<ProviderDashboardStackParamList>();

export function ProviderDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="ProviderDashboardHome" component={ProviderDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="ProviderHub" component={ProviderHubStack} options={{ title: 'Hub' }} />
      <Stack.Screen name="ProviderSubscription" component={ProviderSubscriptionsScreen} options={{ title: 'Plan & subscription' }} />
      <Stack.Screen name="ProviderAnalytics" component={ProviderAnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="ProviderBackgroundCheck" component={ProviderBackgroundCheckScreen} options={{ title: 'Background check' }} />
      <Stack.Screen
        name="ProviderNotifications"
        component={ProviderNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="Notifications" component={ProviderNotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
