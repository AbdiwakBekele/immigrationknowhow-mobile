import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfileStack } from '../screens/account/ProfileStack';
import { SeekerDiscoverStack } from '../screens/discover/SeekerDiscoverStack';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';
import { AiAssistantFab } from '../components/AiAssistantFab';

export type AdvertiserBottomTabParamList = {
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AdvertiserBottomTabParamList>();

export function AdvertiserBottomTabs() {
  const modernTabBarOptions = useModernTabBarOptions();
  return (
    <>
      <Tab.Navigator screenOptions={modernTabBarOptions}>
        <Tab.Screen name="Discover" component={SeekerDiscoverStack} options={{ tabBarIcon: tabBarIcon('compass-outline') }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
      </Tab.Navigator>
      <AiAssistantFab />
    </>
  );
}
