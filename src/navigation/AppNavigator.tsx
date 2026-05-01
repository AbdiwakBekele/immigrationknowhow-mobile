import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { useAuth } from '../context/AuthContext';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';

function PlaceholderAuthedHome() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text>Authenticated. Next: role-based tabs.</Text>
    </View>
  );
}

export function AppNavigator() {
  const { isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return <NavigationContainer>{isAuthenticated ? <PlaceholderAuthedHome /> : <AuthStack />}</NavigationContainer>;
}

