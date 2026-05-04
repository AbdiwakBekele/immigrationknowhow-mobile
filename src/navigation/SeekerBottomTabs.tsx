import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProfileStack } from '../screens/account/ProfileStack';
import { SeekerDashboardStack } from '../screens/seeker/SeekerDashboardStack';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { SeekerDiscoverStack, type SeekerDiscoverStackParamList } from '../screens/discover/SeekerDiscoverStack';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';
import { AiAssistantFab } from '../components/AiAssistantFab';

/** Primary destinations in the bottom bar; other flows live in the drawer. */
export type SeekerBottomTabParamList = {
  Dashboard: undefined;
  Discover: NavigatorScreenParams<SeekerDiscoverStackParamList> | undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<SeekerBottomTabParamList>();

export function SeekerBottomTabs() {
  const modernTabBarOptions = useModernTabBarOptions();
  return (
    <>
      <Tab.Navigator screenOptions={modernTabBarOptions}>
        <Tab.Screen
          name="Dashboard"
          component={SeekerDashboardStack}
          options={{ title: 'Home', tabBarIcon: tabBarIcon('home-outline') }}
        />
        <Tab.Screen name="Discover" component={SeekerDiscoverStack} options={{ tabBarIcon: tabBarIcon('compass-outline') }} />
        <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: tabBarIcon('chatbubbles-outline') }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
      </Tab.Navigator>
      <AiAssistantFab />
    </>
  );
}
