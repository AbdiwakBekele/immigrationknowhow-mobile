import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverHomeScreen } from './DiscoverHomeScreen';
import { DvLotteryScreen } from './DvLotteryScreen';
import { AiAssistantScreen } from './AiAssistantScreen';
import { LibraryStack } from '../library/LibraryStack';
import { VideosStack } from '../videos/VideosStack';
import { CommunityStack } from '../community/CommunityStack';
import { AdsListScreen } from '../ads/AdsListScreen';
import { ReviewsListScreen } from '../reviews/ReviewsListScreen';

export type SeekerDiscoverStackParamList = {
  DiscoverHome: undefined;
  DvLottery: undefined;
  AiAssistant: undefined;
  Library: undefined;
  Videos: undefined;
  Community: undefined;
  Ads: undefined;
  Reviews: undefined;
};

const Stack = createNativeStackNavigator<SeekerDiscoverStackParamList>();

export function SeekerDiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverHome" component={DiscoverHomeScreen} />
      <Stack.Screen name="DvLottery" component={DvLotteryScreen} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
      <Stack.Screen name="Library" component={LibraryStack} />
      <Stack.Screen name="Videos" component={VideosStack} />
      <Stack.Screen name="Community" component={CommunityStack} />
      <Stack.Screen name="Ads" component={AdsListScreen} />
      <Stack.Screen name="Reviews" component={ReviewsListScreen} />
    </Stack.Navigator>
  );
}
