import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdvertiserBottomTabs, type AdvertiserBottomTabParamList } from './AdvertiserBottomTabs';
import { ProfileStack } from '../screens/account/ProfileStack';
import { AdvertiserMobileShell } from '../components/advertiser/AdvertiserMobileShell';
import { useAdvertiserLayout } from '../context/AdvertiserLayoutContext';
import { advertiserSceneStyle } from './advertiserNavigationOptions';
import { drawerGradient } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import {
  DrawerGradientLink,
  drawerBrandStyles,
  drawerScrollPadding,
} from '../components/drawer/DrawerCollapsibleSection';

export type AdvertiserDrawerParamList = {
  Main: NavigatorScreenParams<AdvertiserBottomTabParamList>;
  Profile: undefined;
};

const Drawer = createDrawerNavigator<AdvertiserDrawerParamList>();

function AdvertiserDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  const goMain = (screen: keyof AdvertiserBottomTabParamList) => {
    navigation.closeDrawer();
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen },
      })
    );
  };

  const goCreateAd = () => {
    navigation.closeDrawer();
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'MyAds', params: { screen: 'AdsCreate' } },
      })
    );
  };

  const goProfile = () => {
    navigation.closeDrawer();
    navigation.navigate('Profile');
  };

  return (
    <LinearGradient colors={[...drawerGradient]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradient}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[drawerScrollPadding, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={drawerBrandStyles.brand}>ImmigrationKnowHow</Text>
        <Text style={drawerBrandStyles.brandSub}>Advertiser</Text>

        <DrawerGradientLink icon="speedometer-outline" label="Dashboard" onPress={() => goMain('Dashboard')} />
        <DrawerGradientLink icon="megaphone-outline" label="My Ads" onPress={() => goMain('MyAds')} />
        <DrawerGradientLink icon="add-circle-outline" label="Create ad" onPress={goCreateAd} />
        <DrawerGradientLink icon="stats-chart-outline" label="Ad analytics" onPress={() => goMain('Analytics')} />
        <DrawerGradientLink icon="person-circle-outline" label="Account" onPress={goProfile} />
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
});

export function AdvertiserDrawerNavigator() {
  return (
    <AdvertiserMobileShell>
      <AdvertiserDrawerInner />
    </AdvertiserMobileShell>
  );
}

function AdvertiserDrawerInner() {
  const { drawerWidth } = useAdvertiserLayout();

  return (
    <Drawer.Navigator
      id="AdvertiserRootDrawer"
      drawerContent={(p) => <AdvertiserDrawerContent {...p} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: drawerWidth, backgroundColor: 'transparent' },
        overlayColor: 'rgba(15,23,42,0.45)',
        sceneStyle: advertiserSceneStyle,
      }}
    >
      <Drawer.Screen name="Main" component={AdvertiserBottomTabs} options={{ title: 'Ads' }} />
      <Drawer.Screen name="Profile" component={ProfileStack} options={{ title: 'Account' }} />
    </Drawer.Navigator>
  );
}
