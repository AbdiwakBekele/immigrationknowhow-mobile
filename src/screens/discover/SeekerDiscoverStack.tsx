import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverHomeScreen } from './DiscoverHomeScreen';
import { DvLotteryScreen } from './DvLotteryScreen';
import { AiAssistantScreen } from './AiAssistantScreen';
import { LibraryStack } from '../library/LibraryStack';
import { VideosStack } from '../videos/VideosStack';
import { CommunityStack } from '../community/CommunityStack';
import { AdsStack } from '../ads/AdsStack';
import { ReviewsListScreen } from '../reviews/ReviewsListScreen';
import { ProvidersStack } from '../seeker/ProvidersStack';
import { ContractsStack } from '../contracts/ContractsStack';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type SeekerDiscoverStackParamList = {
  DiscoverHome: undefined;
  DvLottery: undefined;
  AiAssistant: undefined;
  Library: undefined;
  Videos: undefined;
  Community: undefined;
  Ads: undefined;
  Reviews: undefined;
  Providers: undefined;
  Contracts: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<SeekerDiscoverStackParamList>();

export function SeekerDiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="DiscoverHome" component={DiscoverHomeScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="Providers" component={ProvidersStack} options={{ title: 'Providers' }} />
      <Stack.Screen name="Contracts" component={ContractsStack} options={{ title: 'Contracts' }} />
      <Stack.Screen name="DvLottery" component={DvLotteryScreen} options={{ title: 'DV Lottery' }} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="Library" component={LibraryStack} options={{ headerShown: false }} />
      <Stack.Screen name="Videos" component={VideosStack} options={{ title: 'Videos' }} />
      <Stack.Screen name="Community" component={CommunityStack} options={{ headerShown: false }} />
      <Stack.Screen name="Ads" component={AdsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Reviews" component={ReviewsListScreen} options={{ title: 'My reviews' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
