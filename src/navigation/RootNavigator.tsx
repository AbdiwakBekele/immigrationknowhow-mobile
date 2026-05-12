import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DvLotteryProvider } from '../context/DvLotteryContext';
import { SplashScreen } from '../screens/common/SplashScreen';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { ProviderTabs } from './ProviderTabs';
import { SeekerTabs } from './SeekerTabs';
import { AdvertiserTabs } from './AdvertiserTabs';
import type { AuthUser, UserRole } from '../types/user';

function hasMinimumProfileData(user: AuthUser | null, role: UserRole | null): boolean {
  if (!user) return false;
  if (!user.country || !user.state) return false;
  if (role === 'provider' && (!user.phone || !user.phone_verified_at)) return false;
  return true;
}

export function RootNavigator() {
  const { isBootstrapping, isAuthenticated, role, user } = useAuth();

  if (isBootstrapping) return <SplashScreen />;

  const needsOnboarding =
    isAuthenticated &&
    (!user?.onboarding_completed || !hasMinimumProfileData(user, role));

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : needsOnboarding ? (
        <OnboardingStack />
      ) : (
        <DvLotteryProvider>
          {role === 'provider' ? (
            <ProviderTabs />
          ) : role === 'advertiser' ? (
            <AdvertiserTabs />
          ) : (
            <SeekerTabs />
          )}
        </DvLotteryProvider>
      )}
    </NavigationContainer>
  );
}

