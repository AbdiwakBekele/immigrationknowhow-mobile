import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderHubHomeScreen } from './ProviderHubHomeScreen';
import { DvLotteryScreen } from './DvLotteryScreen';
import { LibraryStack } from '../library/LibraryStack';
import { AdsStack } from '../ads/AdsStack';
import { CommunityStack } from '../community/CommunityStack';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type ProviderHubStackParamList = {
  ProviderHubHome: undefined;
  DvLottery: undefined;
  Library: undefined;
  Ads: undefined;
  Community: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<ProviderHubStackParamList>();

export function ProviderHubStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="ProviderHubHome" component={ProviderHubHomeScreen} options={{ title: 'Hub' }} />
      <Stack.Screen name="DvLottery" component={DvLotteryScreen} options={{ title: 'DV Lottery' }} />
      <Stack.Screen name="Library" component={LibraryStack} options={{ headerShown: false }} />
      <Stack.Screen name="Ads" component={AdsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Community" component={CommunityStack} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
