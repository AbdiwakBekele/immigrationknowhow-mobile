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
export function RootNavigator() {
  const { isBootstrapping, isAuthenticated, role, user } = useAuth();

  if (isBootstrapping) return <SplashScreen />;

  const needsOnboarding = isAuthenticated && !user?.onboarding_completed;

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

