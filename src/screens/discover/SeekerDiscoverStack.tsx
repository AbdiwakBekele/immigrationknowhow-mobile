import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverHomeScreen } from './DiscoverHomeScreen';
import { DvLotteryScreen } from './DvLotteryScreen';
import { AiAssistantScreen } from './AiAssistantScreen';
import { LibraryStack, type LibraryStackParamList } from '../library/LibraryStack';
import { VideosStack } from '../videos/VideosStack';
import { CommunityStack } from '../community/CommunityStack';
import { AdsStack } from '../ads/AdsStack';
import { ReviewsListScreen } from '../reviews/ReviewsListScreen';
import { ProvidersStack, type ProvidersStackParamList } from '../seeker/ProvidersStack';
import { ContractsStack, type ContractsStackParamList } from '../contracts/ContractsStack';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { StripeCheckoutScreen, type StripeCheckoutParams } from '../onboarding/StripeCheckoutScreen';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type SeekerDiscoverStackParamList = {
  DiscoverHome: undefined;
  DvLottery: undefined;
  AiAssistant: undefined;
  Library: NavigatorScreenParams<LibraryStackParamList> | undefined;
  Videos: undefined;
  Community: undefined;
  Ads: undefined;
  Reviews: undefined;
  Providers: NavigatorScreenParams<ProvidersStackParamList> | undefined;
  Contracts: NavigatorScreenParams<ContractsStackParamList> | undefined;
  Notifications: undefined;
  StripeCheckout: StripeCheckoutParams;
};

const Stack = createNativeStackNavigator<SeekerDiscoverStackParamList>();

export function SeekerDiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="DiscoverHome" component={DiscoverHomeScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="Providers" component={ProvidersStack} options={{ headerShown: false }} />
      <Stack.Screen name="Contracts" component={ContractsStack} options={{ headerShown: false }} />
      <Stack.Screen name="DvLottery" component={DvLotteryScreen} options={{ title: 'DV Lottery' }} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="Library" component={LibraryStack} options={{ headerShown: false }} />
      <Stack.Screen name="Videos" component={VideosStack} options={{ headerShown: false }} />
      <Stack.Screen name="Community" component={CommunityStack} options={{ headerShown: false }} />
      <Stack.Screen name="Ads" component={AdsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Reviews" component={ReviewsListScreen} options={{ title: 'My reviews' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
