import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingHomeScreen } from '../screens/onboarding/OnboardingHomeScreen';

export type OnboardingStackParamList = {
  OnboardingHome: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingHome" component={OnboardingHomeScreen} />
    </Stack.Navigator>
  );
}

