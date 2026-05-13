import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryDetailScreen } from './LibraryDetailScreen';
import { LibraryMyScreen } from './LibraryMyScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { NotificationsScreen } from '../notifications/NotificationsScreen';

export type LibraryStackParamList = {
  LibraryMy: undefined;
  LibraryDetail: { slug: string; readerMode?: boolean };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ header: (p) => <AppHeader {...p} /> }}>
      <Stack.Screen name="LibraryMy" component={LibraryMyScreen} options={{ title: 'My Library' }} />
      <Stack.Screen name="LibraryDetail" component={LibraryDetailScreen} options={{ title: 'My Library' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}
