import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useNavigation, CommonActions, useNavigationState } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStack } from '../screens/account/ProfileStack';
import { MessagesStack, type MessagesStackParamList } from '../screens/messages/MessagesStack';
import { LeadsStack, type LeadsStackParamList } from '../screens/provider/LeadsStack';
import { ProviderDashboardStack, type ProviderDashboardStackParamList } from '../screens/provider/ProviderDashboardStack';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';
import { colors } from '../theme/colors';

/** Primary provider destinations in the bottom bar; hub & billing live in the drawer. */
export type ProviderBottomTabParamList = {
  Dashboard: NavigatorScreenParams<ProviderDashboardStackParamList> | undefined;
  Leads: NavigatorScreenParams<LeadsStackParamList> | undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderBottomTabParamList>();

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

function getActiveRouteName(state: { index?: number; routes: Array<{ name: string; state?: unknown }> }): string {
  const route = state.routes[state.index ?? 0];
  if (route.state && typeof route.state === 'object' && 'routes' in route.state) {
    return getActiveRouteName(route.state as { index?: number; routes: Array<{ name: string; state?: unknown }> });
  }
  return route.name;
}

function AiAssistantFab() {
  const drawer = useNavigation<DrawerNavigationProp<{ Main: undefined }>>();
  const activeRoute = useNavigationState((state) => {
    try {
      return getActiveRouteName(state);
    } catch {
      return '';
    }
  });

  if (activeRoute === 'ProviderAiAssistant') return null;

  return (
    <Pressable
      onPress={() => {
        drawer.dispatch(
          CommonActions.navigate({
            name: 'Main',
            params: {
              screen: 'Dashboard',
              params: { screen: 'ProviderAiAssistant' },
            },
          })
        );
      }}
      accessibilityRole="button"
      accessibilityLabel="Open AI Assistant"
      style={({ pressed }) => [fabStyles.fab, pressed && fabStyles.fabPressed]}
    >
      <Ionicons name="sparkles" size={26} color="#fff" />
    </Pressable>
  );
}

export function ProviderBottomTabs() {
  const modernTabBarOptions = useModernTabBarOptions();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={modernTabBarOptions}
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
      <AiAssistantFab />
    </View>
  );
}
