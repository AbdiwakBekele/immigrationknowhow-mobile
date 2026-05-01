import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderHubHomeScreen } from './ProviderHubHomeScreen';
import { DvLotteryScreen } from './DvLotteryScreen';
import { LibraryStack } from '../library/LibraryStack';
import { AdsListScreen } from '../ads/AdsListScreen';
import { CommunityStack } from '../community/CommunityStack';

export type ProviderHubStackParamList = {
  ProviderHubHome: undefined;
  DvLottery: undefined;
  Library: undefined;
  Ads: undefined;
  Community: undefined;
};

const Stack = createNativeStackNavigator<ProviderHubStackParamList>();

export function ProviderHubStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProviderHubHome" component={ProviderHubHomeScreen} />
      <Stack.Screen name="DvLottery" component={DvLotteryScreen} />
      <Stack.Screen name="Library" component={LibraryStack} />
      <Stack.Screen name="Ads" component={AdsListScreen} />
      <Stack.Screen name="Community" component={CommunityStack} />
    </Stack.Navigator>
  );
}
