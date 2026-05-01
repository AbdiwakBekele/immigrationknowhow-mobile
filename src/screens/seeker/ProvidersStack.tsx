import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProvidersListScreen } from './ProvidersListScreen';
import { ProviderDetailScreen } from './ProviderDetailScreen';
import { ContactProviderScreen } from './ContactProviderScreen';

export type ProvidersStackParamList = {
  ProvidersList: undefined;
  ProviderDetail: { slug: string };
  ContactProvider: { slug: string };
};

const Stack = createNativeStackNavigator<ProvidersStackParamList>();

export function ProvidersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProvidersList" component={ProvidersListScreen} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <Stack.Screen name="ContactProvider" component={ContactProviderScreen} />
    </Stack.Navigator>
  );
}

