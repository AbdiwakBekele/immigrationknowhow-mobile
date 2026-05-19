import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderDashboardScreen } from './ProviderDashboardScreen';
import { ProviderNotificationsScreen } from './ProviderNotificationsScreen';
import { ProviderHubStack, type ProviderHubStackParamList } from '../discover/ProviderHubStack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProviderSubscriptionsScreen } from './ProviderSubscriptionsScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { ProviderAnalyticsScreen } from './ProviderAnalyticsScreen';
import { ProviderBackgroundCheckScreen } from './ProviderBackgroundCheckScreen';
import { ProviderReviewsScreen } from './ProviderReviewsScreen';
import { AiAssistantScreen } from '../discover/AiAssistantScreen';
import { StripeCheckoutScreen, type StripeCheckoutParams } from '../onboarding/StripeCheckoutScreen';

export type ProviderDashboardStackParamList = {
  ProviderDashboardHome: undefined;
  ProviderNotifications: undefined;
  ProviderHub: NavigatorScreenParams<ProviderHubStackParamList> | undefined;
  ProviderSubscription: undefined;
  ProviderAnalytics: undefined;
  ProviderBackgroundCheck: undefined;
  ProviderReviews: undefined;
  ProviderAiAssistant: undefined;
  Notifications: undefined;
  StripeCheckout: StripeCheckoutParams;
};

const Stack = createNativeStackNavigator<ProviderDashboardStackParamList>();

export function ProviderDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="ProviderDashboardHome" component={ProviderDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="ProviderHub" component={ProviderHubStack} options={{ headerShown: false }} />
      <Stack.Screen name="ProviderSubscription" component={ProviderSubscriptionsScreen} options={{ title: 'Plan & subscription' }} />
      <Stack.Screen name="ProviderAnalytics" component={ProviderAnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="ProviderBackgroundCheck" component={ProviderBackgroundCheckScreen} options={{ title: 'Background check' }} />
      <Stack.Screen name="ProviderReviews" component={ProviderReviewsScreen} options={{ title: 'Reviews' }} />
      <Stack.Screen
        name="ProviderNotifications"
        component={ProviderNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="Notifications" component={ProviderNotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ProviderAiAssistant" component={AiAssistantScreen} options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
