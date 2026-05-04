import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderBottomTabs, type ProviderBottomTabParamList } from './ProviderBottomTabs';
import { drawerGradient } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import {
  DrawerCollapsibleSection,
  DrawerGradientLink,
  drawerBrandStyles,
  drawerScrollPadding,
} from '../components/drawer/DrawerCollapsibleSection';
import { useDvLottery } from '../context/DvLotteryContext';

export type ProviderDrawerParamList = {
  Main: NavigatorScreenParams<ProviderBottomTabParamList>;
};

const Drawer = createDrawerNavigator<ProviderDrawerParamList>();

function ProviderDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { showInMenu: dvInMenu } = useDvLottery();

  const goMain = (screen: keyof ProviderBottomTabParamList) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Main', params: { screen } }));
    navigation.closeDrawer();
  };

  const goHub = (screen: 'DvLottery' | 'Library' | 'Ads' | 'Community') => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: {
          screen: 'Dashboard',
          params: { screen: 'ProviderHub', params: { screen } },
        },
      })
    );
    navigation.closeDrawer();
  };

  const goSubscription = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Dashboard', params: { screen: 'ProviderSubscription' } },
      })
    );
    navigation.closeDrawer();
  };

  const goProviderAnalytics = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Dashboard', params: { screen: 'ProviderAnalytics' } },
      })
    );
    navigation.closeDrawer();
  };

  const goProviderBackgroundCheck = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Dashboard', params: { screen: 'ProviderBackgroundCheck' } },
      })
    );
    navigation.closeDrawer();
  };

  const goMessagesList = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Messages', params: { screen: 'MessagesList' } },
      })
    );
    navigation.closeDrawer();
  };

  return (
    <LinearGradient colors={[...drawerGradient]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradient}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[drawerScrollPadding, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={drawerBrandStyles.brand}>ImmigrationKnowHow</Text>
        <Text style={drawerBrandStyles.brandSub}>Service provider</Text>

        <DrawerGradientLink icon="speedometer-outline" label="Dashboard" onPress={() => goMain('Dashboard')} />

        <DrawerCollapsibleSection title="Account" defaultOpen>
          <DrawerGradientLink icon="mail-unread-outline" label="Leads" onPress={() => goMain('Leads')} indent />
          <DrawerGradientLink icon="chatbubbles-outline" label="Messages" onPress={goMessagesList} indent />
          <DrawerGradientLink icon="person-circle-outline" label="Profile" onPress={() => goMain('Profile')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Hub & tools" defaultOpen>
          {dvInMenu ? (
            <DrawerGradientLink icon="earth-outline" label="DV Lottery" onPress={() => goHub('DvLottery')} indent />
          ) : null}
          <DrawerGradientLink icon="library-outline" label="My Library" onPress={() => goHub('Library')} indent />
          <DrawerGradientLink icon="megaphone-outline" label="My Ads" onPress={() => goHub('Ads')} indent />
          <DrawerGradientLink icon="people-outline" label="Community" onPress={() => goHub('Community')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Billing" defaultOpen>
          <DrawerGradientLink icon="card-outline" label="Plan & subscription" onPress={goSubscription} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Trust & analytics" defaultOpen>
          <DrawerGradientLink icon="stats-chart-outline" label="Analytics" onPress={goProviderAnalytics} indent />
          <DrawerGradientLink icon="shield-checkmark-outline" label="Background check" onPress={goProviderBackgroundCheck} indent />
        </DrawerCollapsibleSection>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
});

export function ProviderDrawerNavigator() {
  return (
    <Drawer.Navigator
      id="ProviderRootDrawer"
      drawerContent={(p) => <ProviderDrawerContent {...p} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 320, backgroundColor: 'transparent' },
        overlayColor: 'rgba(15,23,42,0.45)',
      }}
    >
      <Drawer.Screen name="Main" component={ProviderBottomTabs} options={{ title: 'Home' }} />
    </Drawer.Navigator>
  );
}
