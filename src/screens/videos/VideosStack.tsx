import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VideosListScreen } from './VideosListScreen';
import { VideoDetailScreen } from './VideoDetailScreen';

export type VideosStackParamList = {
  VideosList: undefined;
  VideoDetail: { slug: string };
};

const Stack = createNativeStackNavigator<VideosStackParamList>();

export function VideosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VideosList" component={VideosListScreen} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
    </Stack.Navigator>
  );
}
