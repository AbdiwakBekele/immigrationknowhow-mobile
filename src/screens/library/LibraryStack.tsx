import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryBrowseScreen } from './LibraryBrowseScreen';
import { LibraryDetailScreen } from './LibraryDetailScreen';
import { LibraryMyScreen } from './LibraryMyScreen';

export type LibraryStackParamList = {
  LibraryBrowse: undefined;
  LibraryMy: undefined;
  LibraryDetail: { slug: string };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryBrowse" component={LibraryBrowseScreen} />
      <Stack.Screen name="LibraryMy" component={LibraryMyScreen} />
      <Stack.Screen name="LibraryDetail" component={LibraryDetailScreen} />
    </Stack.Navigator>
  );
}
