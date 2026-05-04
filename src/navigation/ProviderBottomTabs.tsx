import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProfileStack } from '../screens/account/ProfileStack';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { LeadsStack, type LeadsStackParamList } from '../screens/provider/LeadsStack';
import { ProviderDashboardStack, type ProviderDashboardStackParamList } from '../screens/provider/ProviderDashboardStack';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';

/** Primary provider destinations in the bottom bar; hub & billing live in the drawer. */
export type ProviderBottomTabParamList = {
  Dashboard: NavigatorScreenParams<ProviderDashboardStackParamList> | undefined;
  Leads: NavigatorScreenParams<LeadsStackParamList> | undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderBottomTabParamList>();

export function ProviderBottomTabs() {
  const modernTabBarOptions = useModernTabBarOptions();
  return (
    <Tab.Navigator screenOptions={modernTabBarOptions}>
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardStack}
        options={{ title: 'Home', tabBarIcon: tabBarIcon('speedometer-outline') }}
      />
      <Tab.Screen name="Leads" component={LeadsStack} options={{ tabBarIcon: tabBarIcon('mail-unread-outline') }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: tabBarIcon('chatbubbles-outline') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
    </Tab.Navigator>
  );
}
