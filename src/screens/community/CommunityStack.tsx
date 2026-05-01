import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityListScreen } from './CommunityListScreen';
import { CommunityPostScreen } from './CommunityPostScreen';
import { CommunityNewsScreen } from './CommunityNewsScreen';

export type CommunityStackParamList = {
  CommunityList: undefined;
  CommunityPost: { id: number };
  CommunityNews: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityList" component={CommunityListScreen} />
      <Stack.Screen name="CommunityPost" component={CommunityPostScreen} />
      <Stack.Screen name="CommunityNews" component={CommunityNewsScreen} />
    </Stack.Navigator>
  );
}
