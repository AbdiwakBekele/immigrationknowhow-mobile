import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeekerBottomTabs, type SeekerBottomTabParamList } from './SeekerBottomTabs';
import { ProvidersStack } from '../screens/seeker/ProvidersStack';
import { ContractsStack } from '../screens/contracts/ContractsStack';
import type { SeekerDiscoverStackParamList } from '../screens/discover/SeekerDiscoverStack';
import { drawerGradient } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import {
  DrawerCollapsibleSection,
  DrawerGradientLink,
  drawerBrandStyles,
  drawerScrollPadding,
} from '../components/drawer/DrawerCollapsibleSection';

export type SeekerDrawerParamList = {
  Main: NavigatorScreenParams<SeekerBottomTabParamList>;
  Providers: undefined;
  Contracts: undefined;
};

const Drawer = createDrawerNavigator<SeekerDrawerParamList>();

function SeekerDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  const goMain = (screen: keyof SeekerBottomTabParamList) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Main', params: { screen } }));
    navigation.closeDrawer();
  };

  const goDiscover = (screen: keyof SeekerDiscoverStackParamList) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Discover', params: { screen } },
      })
    );
    navigation.closeDrawer();
  };

  const goProvidersList = () => {
    navigation.dispatch(CommonActions.navigate({ name: 'Providers', params: { screen: 'ProvidersList' } }));
    navigation.closeDrawer();
  };

  const goContractsList = () => {
    navigation.dispatch(CommonActions.navigate({ name: 'Contracts', params: { screen: 'ContractsList' } }));
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
        <Text style={drawerBrandStyles.brandSub}>Service seeker</Text>

        <DrawerCollapsibleSection title="Home & account" defaultOpen>
          <DrawerGradientLink icon="home-outline" label="Dashboard" onPress={() => goMain('Dashboard')} indent />
          <DrawerGradientLink icon="chatbubbles-outline" label="Messages" onPress={goMessagesList} indent />
          <DrawerGradientLink icon="person-circle-outline" label="Profile" onPress={() => goMain('Profile')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Discover" defaultOpen>
          <DrawerGradientLink icon="planet-outline" label="Discover home" onPress={() => goDiscover('DiscoverHome')} indent />
          <DrawerGradientLink icon="earth-outline" label="DV Lottery" onPress={() => goDiscover('DvLottery')} indent />
          <DrawerGradientLink icon="sparkles-outline" label="AI Assistant" onPress={() => goDiscover('AiAssistant')} indent />
          <DrawerGradientLink icon="library-outline" label="Library" onPress={() => goDiscover('Library')} indent />
          <DrawerGradientLink icon="play-circle-outline" label="Videos" onPress={() => goDiscover('Videos')} indent />
          <DrawerGradientLink icon="people-outline" label="Community" onPress={() => goDiscover('Community')} indent />
          <DrawerGradientLink icon="megaphone-outline" label="Sponsored ads" onPress={() => goDiscover('Ads')} indent />
          <DrawerGradientLink icon="star-outline" label="My reviews" onPress={() => goDiscover('Reviews')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Providers" defaultOpen>
          <DrawerGradientLink icon="search-outline" label="Browse providers" onPress={goProvidersList} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Contracts" defaultOpen>
          <DrawerGradientLink icon="document-text-outline" label="My contracts" onPress={goContractsList} indent />
        </DrawerCollapsibleSection>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export function SeekerDrawerNavigator() {
  return (
    <Drawer.Navigator
      id="SeekerRootDrawer"
      drawerContent={(p) => <SeekerDrawerContent {...p} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 320, backgroundColor: 'transparent' },
        overlayColor: 'rgba(15,23,42,0.45)',
      }}
    >
      <Drawer.Screen name="Main" component={SeekerBottomTabs} options={{ title: 'Home' }} />
      <Drawer.Screen name="Providers" component={ProvidersStack} options={{ title: 'Providers' }} />
      <Drawer.Screen name="Contracts" component={ContractsStack} options={{ title: 'Contracts' }} />
    </Drawer.Navigator>
  );
}
