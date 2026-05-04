import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AdsListScreen } from './AdsListScreen';
import { AdsCreateScreen } from './AdsCreateScreen';

export type AdsStackParamList = {
  AdsHome: undefined;
  AdsCreate: undefined;
};

const Stack = createNativeStackNavigator<AdsStackParamList>();

export function AdsStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="AdsHome" component={AdsListScreen} options={{ title: 'My Ads' }} />
      <Stack.Screen name="AdsCreate" component={AdsCreateScreen} options={{ title: 'Create Ad' }} />
    </Stack.Navigator>
  );
}

