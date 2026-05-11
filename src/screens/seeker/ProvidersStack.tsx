import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProvidersListScreen } from './ProvidersListScreen';
import { ProviderDetailScreen } from './ProviderDetailScreen';
import { ContactProviderScreen } from './ContactProviderScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type ProvidersStackParamList = {
  ProvidersList: { favoritesOnly?: boolean } | undefined;
  ProviderDetail: { slug: string };
  ContactProvider: { slug: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<ProvidersStackParamList>();

export function ProvidersStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="ProvidersList" component={ProvidersListScreen} options={{ title: 'Providers' }} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ title: 'Provider' }} />
      <Stack.Screen name="ContactProvider" component={ContactProviderScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

