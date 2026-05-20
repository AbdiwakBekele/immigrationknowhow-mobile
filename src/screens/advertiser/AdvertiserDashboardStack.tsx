import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdvertiserStackHeader } from '../../components/navigation/AdvertiserStackHeader';
import { advertiserStackScreenOptions } from '../../navigation/advertiserNavigationOptions';
import { AdvertiserDashboardScreen } from './AdvertiserDashboardScreen';

export type AdvertiserDashboardStackParamList = {
  AdvertiserDashboardHome: undefined;
};

const Stack = createNativeStackNavigator<AdvertiserDashboardStackParamList>();

export function AdvertiserDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...advertiserStackScreenOptions, header: (p) => <AdvertiserStackHeader {...p} /> }}>
      <Stack.Screen
        name="AdvertiserDashboardHome"
        component={AdvertiserDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
}
