import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContractsListScreen } from './ContractsListScreen';
import { ContractDetailScreen } from './ContractDetailScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type ContractsStackParamList = {
  ContractsList: undefined;
  ContractDetail: { uuid: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<ContractsStackParamList>();

export function ContractsStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="ContractsList" component={ContractsListScreen} options={{ title: 'Contracts' }} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ title: 'Contract' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

