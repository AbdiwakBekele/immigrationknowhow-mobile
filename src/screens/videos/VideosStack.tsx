import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VideosListScreen } from './VideosListScreen';
import { VideoDetailScreen } from './VideoDetailScreen';
import { StripeCheckoutScreen, type StripeCheckoutParams } from '../onboarding/StripeCheckoutScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type VideosStackParamList = {
  VideosList: undefined;
  VideoDetail: { slug: string };
  Notifications: undefined;
  StripeCheckout: StripeCheckoutParams;
};

const Stack = createNativeStackNavigator<VideosStackParamList>();

export function VideosStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="VideosList" component={VideosListScreen} options={{ title: 'Videos' }} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} options={{ title: 'Video' }} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
