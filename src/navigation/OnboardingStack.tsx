import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingHomeScreen } from '../screens/onboarding/OnboardingHomeScreen';
import { StripeCheckoutScreen } from '../screens/onboarding/StripeCheckoutScreen';

export type OnboardingStackParamList = {
  OnboardingHome: undefined;
  StripeCheckout: { checkoutUrl: string; variant?: 'onboarding' | 'default'; adUuid?: string };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingHome" component={OnboardingHomeScreen} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} />
    </Stack.Navigator>
  );
}

