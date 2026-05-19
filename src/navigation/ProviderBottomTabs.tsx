import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { ProfileStack } from '../screens/account/ProfileStack';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { LeadsStack, type LeadsStackParamList } from '../screens/provider/LeadsStack';
import { ProviderDashboardStack, type ProviderDashboardStackParamList } from '../screens/provider/ProviderDashboardStack';
import { AiAssistantFab } from '../components/AiAssistantFab';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';
import { routeHasReaderMode } from './readerMode';

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
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...modernTabBarOptions,
          tabBarStyle: routeHasReaderMode(route)
            ? [modernTabBarOptions.tabBarStyle, { display: 'none' }]
            : modernTabBarOptions.tabBarStyle,
        })}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const state = navigation.getState();
            const tabIndex = state.routes.findIndex(
              (r: { name: string }) => r.name === route.name
            );
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
          component={ProviderDashboardStack}
          options={{ title: 'Home', tabBarIcon: tabBarIcon('speedometer-outline') }}
        />
        <Tab.Screen name="Leads" component={LeadsStack} options={{ tabBarIcon: tabBarIcon('mail-unread-outline') }} />
        <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: tabBarIcon('chatbubbles-outline') }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: tabBarIcon('person-circle-outline') }} />
      </Tab.Navigator>
      <AiAssistantFab variant="provider" />
    </View>
  );
}
