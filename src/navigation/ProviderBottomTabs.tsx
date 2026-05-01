import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { LeadsStack } from '../screens/provider/LeadsStack';
import { ProviderDashboardStack } from '../screens/provider/ProviderDashboardStack';
import { modernTabBarOptions, tabBarIcon } from './tabBar';

/** Primary provider destinations in the bottom bar; hub & billing live in the drawer. */
export type ProviderBottomTabParamList = {
  Dashboard: undefined;
  Leads: undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderBottomTabParamList>();

export function ProviderBottomTabs() {
  return (
    <Tab.Navigator screenOptions={modernTabBarOptions}>
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardStack}
        options={{ title: 'Home', tabBarIcon: tabBarIcon('speedometer-outline') }}
      />
      <Tab.Screen name="Leads" component={LeadsStack} options={{ tabBarIcon: tabBarIcon('mail-unread-outline') }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: tabBarIcon('chatbubbles-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
    </Tab.Navigator>
  );
}
