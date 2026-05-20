import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdvertiserStackHeader } from '../../components/navigation/AdvertiserStackHeader';
import { advertiserStackScreenOptions } from '../../navigation/advertiserNavigationOptions';
import { AdvertiserAnalyticsScreen } from './AdvertiserAnalyticsScreen';

export type AdvertiserAnalyticsStackParamList = {
  AdvertiserAnalytics: undefined;
};

const Stack = createNativeStackNavigator<AdvertiserAnalyticsStackParamList>();

export function AdvertiserAnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ ...advertiserStackScreenOptions, header: (p) => <AdvertiserStackHeader {...p} /> }}>
      <Stack.Screen
        name="AdvertiserAnalytics"
        component={AdvertiserAnalyticsScreen}
        options={{ title: 'Ad analytics' }}
      />
    </Stack.Navigator>
  );
}
