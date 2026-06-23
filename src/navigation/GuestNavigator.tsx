import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GuestActionsProvider } from '../context/GuestActionsContext';
import { GuestHomeHeader } from '../components/guest/GuestHomeHeader';
import { GuestProvidersScreen } from '../screens/guest/GuestProvidersScreen';
import { GuestLibraryScreen } from '../screens/guest/GuestLibraryScreen';
import { GuestHowItWorksScreen } from '../screens/guest/GuestHowItWorksScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { tabBarIcon, useModernTabBarOptions } from './tabBar';

export type GuestTabParamList = {
  GuestProviders: undefined;
  GuestLibrary: undefined;
  GuestHowItWorks: undefined;
};

export type GuestStackParamList = {
  GuestTabs: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

const Tab = createBottomTabNavigator<GuestTabParamList>();
const Stack = createNativeStackNavigator<GuestStackParamList>();

function GuestTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const modernTabBarOptions = useModernTabBarOptions();

  return (
    <GuestActionsProvider
      goSignIn={() => navigation.navigate('SignIn')}
      goSignUp={() => navigation.navigate('SignUp')}
    >
      <View style={{ flex: 1 }}>
        <GuestHomeHeader
          onSignIn={() => navigation.navigate('SignIn')}
          onSignUp={() => navigation.navigate('SignUp')}
        />
        <Tab.Navigator screenOptions={modernTabBarOptions}>
        <Tab.Screen
          name="GuestProviders"
          component={GuestProvidersScreen}
          options={{ title: 'Service Providers', tabBarIcon: tabBarIcon('people-outline') }}
        />
        <Tab.Screen
          name="GuestLibrary"
          component={GuestLibraryScreen}
          options={{ title: 'eBooks', tabBarIcon: tabBarIcon('book-outline') }}
        />
        <Tab.Screen
          name="GuestHowItWorks"
          component={GuestHowItWorksScreen}
          options={{ title: 'How it works', tabBarIcon: tabBarIcon('help-circle-outline') }}
        />
      </Tab.Navigator>
    </View>
    </GuestActionsProvider>
  );
}

export function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestTabs" component={GuestTabs} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
