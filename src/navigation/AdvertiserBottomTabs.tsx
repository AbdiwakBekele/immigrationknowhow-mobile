import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { AdsStack, type AdsStackParamList } from '../screens/ads/AdsStack';
import {
  AdvertiserAnalyticsStack,
  type AdvertiserAnalyticsStackParamList,
} from '../screens/advertiser/AdvertiserAnalyticsStack';
import {
  AdvertiserDashboardStack,
  type AdvertiserDashboardStackParamList,
} from '../screens/advertiser/AdvertiserDashboardStack';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';
import { routeHasReaderMode } from './readerMode';
import { advertiserTabScreenOptions } from './advertiserNavigationOptions';

export type AdvertiserBottomTabParamList = {
  Dashboard: NavigatorScreenParams<AdvertiserDashboardStackParamList> | undefined;
  MyAds: NavigatorScreenParams<AdsStackParamList> | undefined;
  Analytics: NavigatorScreenParams<AdvertiserAnalyticsStackParamList> | undefined;
};

/** @deprecated Use AdvertiserBottomTabParamList */
export type AdvertiserTabParamList = AdvertiserBottomTabParamList;

const Tab = createBottomTabNavigator<AdvertiserBottomTabParamList>();

const PRIMARY_TABS = ['Dashboard', 'MyAds', 'Analytics'] as const;

export function AdvertiserBottomTabs() {
  const modernTabBarOptions = useModernTabBarOptions();
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => ({
          ...modernTabBarOptions,
          ...advertiserTabScreenOptions,
          tabBarStyle: routeHasReaderMode(route)
            ? [modernTabBarOptions.tabBarStyle, { display: 'none' }]
            : modernTabBarOptions.tabBarStyle,
        })}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (!PRIMARY_TABS.includes(route.name as (typeof PRIMARY_TABS)[number])) return;
            e.preventDefault();
            const state = navigation.getState();
            const tabIndex = state.routes.findIndex((r: { name: string }) => r.name === route.name);
            navigation.dispatch(
              CommonActions.reset({
                ...state,
                index: tabIndex,
                routes: state.routes.map((r: { name: string }) =>
                  r.name === route.name ? { ...r, state: undefined } : r
                ),
              })
            );
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={AdvertiserDashboardStack}
          options={{ title: 'Home', tabBarIcon: tabBarIcon('speedometer-outline') }}
        />
        <Tab.Screen
          name="MyAds"
          component={AdsStack}
          options={{ title: 'My Ads', tabBarIcon: tabBarIcon('megaphone-outline') }}
        />
        <Tab.Screen
          name="Analytics"
          component={AdvertiserAnalyticsStack}
          options={{ title: 'Analytics', tabBarIcon: tabBarIcon('stats-chart-outline') }}
        />
      </Tab.Navigator>
    </View>
  );
}
