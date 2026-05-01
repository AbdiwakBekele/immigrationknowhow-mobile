import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContractsListScreen } from './ContractsListScreen';
import { ContractDetailScreen } from './ContractDetailScreen';

export type ContractsStackParamList = {
  ContractsList: undefined;
  ContractDetail: { uuid: string };
};

const Stack = createNativeStackNavigator<ContractsStackParamList>();

export function ContractsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ContractsList" component={ContractsListScreen} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
    </Stack.Navigator>
  );
}

