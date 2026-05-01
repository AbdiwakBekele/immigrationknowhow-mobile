import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { SeekerDashboardScreen } from '../screens/seeker/SeekerDashboardScreen';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { SeekerDiscoverStack } from '../screens/discover/SeekerDiscoverStack';
import { modernTabBarOptions, tabBarIcon } from './tabBar';

/** Primary destinations in the bottom bar; other flows live in the drawer. */
export type SeekerBottomTabParamList = {
  Dashboard: undefined;
  Discover: undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<SeekerBottomTabParamList>();

export function SeekerBottomTabs() {
  return (
    <Tab.Navigator screenOptions={modernTabBarOptions}>
      <Tab.Screen
        name="Dashboard"
        component={SeekerDashboardScreen}
        options={{ title: 'Home', tabBarIcon: tabBarIcon('home-outline') }}
      />
      <Tab.Screen name="Discover" component={SeekerDiscoverStack} options={{ tabBarIcon: tabBarIcon('compass-outline') }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: tabBarIcon('chatbubbles-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
    </Tab.Navigator>
  );
}
