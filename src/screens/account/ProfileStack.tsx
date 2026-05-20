import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { AddSeekerRoleScreen } from './AddSeekerRoleScreen';
import { AddProviderRoleScreen } from './AddProviderRoleScreen';
import { StripeCheckoutScreen } from '../onboarding/StripeCheckoutScreen';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AdvertiserStackHeader } from '../../components/navigation/AdvertiserStackHeader';
import { useAuth } from '../../context/AuthContext';
import { advertiserStackScreenOptions } from '../../navigation/advertiserNavigationOptions';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Notifications: undefined;
  AddSeekerRole: undefined;
  AddProviderRole: undefined;
  StripeCheckout: { checkoutUrl: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const { role } = useAuth();
  const isAdvertiserPortal = role === 'advertiser';

  return (
    <Stack.Navigator
      screenOptions={{
        ...(isAdvertiserPortal ? advertiserStackScreenOptions : {}),
        header: (p) => (isAdvertiserPortal ? <AdvertiserStackHeader {...p} /> : <AppHeader {...p} />),
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="AddSeekerRole" component={AddSeekerRoleScreen} options={{ title: 'Service seeker account' }} />
      <Stack.Screen name="AddProviderRole" component={AddProviderRoleScreen} options={{ title: 'Service provider account' }} />
      <Stack.Screen name="StripeCheckout" component={StripeCheckoutScreen} options={{ title: 'Checkout' }} />
    </Stack.Navigator>
  );
}

