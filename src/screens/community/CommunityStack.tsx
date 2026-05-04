import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityListScreen } from './CommunityListScreen';
import { CommunityPostScreen } from './CommunityPostScreen';
import { CommunityNewsScreen } from './CommunityNewsScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type CommunityStackParamList = {
  CommunityList: undefined;
  CommunityPost: { id: number };
  CommunityNews: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="CommunityList" component={CommunityListScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="CommunityPost" component={CommunityPostScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CommunityNews" component={CommunityNewsScreen} options={{ title: 'News' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
