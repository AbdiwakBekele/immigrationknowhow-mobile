import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { SeekerDiscoverStack } from '../screens/discover/SeekerDiscoverStack';
import { modernTabBarOptions, tabBarIcon } from './tabBar';

export type AdvertiserBottomTabParamList = {
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AdvertiserBottomTabParamList>();

export function AdvertiserBottomTabs() {
  return (
    <Tab.Navigator screenOptions={modernTabBarOptions}>
      <Tab.Screen name="Discover" component={SeekerDiscoverStack} options={{ tabBarIcon: tabBarIcon('compass-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
    </Tab.Navigator>
  );
}
