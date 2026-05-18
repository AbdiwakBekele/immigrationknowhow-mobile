import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AdsListScreen } from './AdsListScreen';
import { AdsCreateScreen } from './AdsCreateScreen';
import { AdsEditScreen } from './AdsEditScreen';
import { StripeCheckoutScreen } from '../onboarding/StripeCheckoutScreen';

export type AdsStackParamList = {
  AdsHome: undefined;
  AdsCreate: undefined;
  AdsEdit: { uuid: string };
  StripeCheckout: { checkoutUrl: string; variant?: 'onboarding' | 'default'; adUuid?: string };
};

const Stack = createNativeStackNavigator<AdsStackParamList>();

export function AdsStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="AdsHome" component={AdsListScreen} options={{ title: 'My Ads' }} />
      <Stack.Screen name="AdsCreate" component={AdsCreateScreen} options={{ title: 'Create Ad' }} />
      <Stack.Screen name="AdsEdit" component={AdsEditScreen} options={{ title: 'Edit Ad' }} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

