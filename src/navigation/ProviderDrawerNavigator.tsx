import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderBottomTabs, type ProviderBottomTabParamList } from './ProviderBottomTabs';
import { ProviderHubStack, type ProviderHubStackParamList } from '../screens/discover/ProviderHubStack';
import { ProviderSubscriptionsScreen } from '../screens/provider/ProviderSubscriptionsScreen';
import { drawerGradient } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import {
  DrawerCollapsibleSection,
  DrawerGradientLink,
  drawerBrandStyles,
  drawerScrollPadding,
} from '../components/drawer/DrawerCollapsibleSection';

export type ProviderDrawerParamList = {
  Main: NavigatorScreenParams<ProviderBottomTabParamList>;
  More: undefined;
  Subscription: undefined;
};

const Drawer = createDrawerNavigator<ProviderDrawerParamList>();

function ProviderDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  const goMain = (screen: keyof ProviderBottomTabParamList) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Main', params: { screen } }));
    navigation.closeDrawer();
  };

  const goMore = (screen: keyof ProviderHubStackParamList) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'More',
        params: { screen },
      })
    );
    navigation.closeDrawer();
  };

  const goSubscription = () => {
    navigation.dispatch(CommonActions.navigate({ name: 'Subscription' }));
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

        <DrawerCollapsibleSection title="Main" defaultOpen>
          <DrawerGradientLink icon="speedometer-outline" label="Dashboard" onPress={() => goMain('Dashboard')} indent />
          <DrawerGradientLink icon="mail-unread-outline" label="Leads" onPress={() => goMain('Leads')} indent />
          <DrawerGradientLink icon="chatbubbles-outline" label="Messages" onPress={goMessagesList} indent />
          <DrawerGradientLink icon="person-circle-outline" label="Profile" onPress={() => goMain('Profile')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Hub & tools" defaultOpen>
          <DrawerGradientLink icon="grid-outline" label="Hub home" onPress={() => goMore('ProviderHubHome')} indent />
          <DrawerGradientLink icon="earth-outline" label="DV Lottery" onPress={() => goMore('DvLottery')} indent />
          <DrawerGradientLink icon="library-outline" label="Library" onPress={() => goMore('Library')} indent />
          <DrawerGradientLink icon="megaphone-outline" label="Sponsored ads" onPress={() => goMore('Ads')} indent />
          <DrawerGradientLink icon="people-outline" label="Community" onPress={() => goMore('Community')} indent />
        </DrawerCollapsibleSection>

        <DrawerCollapsibleSection title="Billing" defaultOpen>
          <DrawerGradientLink icon="card-outline" label="Plan & subscription" onPress={goSubscription} indent />
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
      <Drawer.Screen name="More" component={ProviderHubStack} options={{ title: 'More' }} />
      <Drawer.Screen name="Subscription" component={ProviderSubscriptionsScreen} options={{ title: 'Plan' }} />
    </Drawer.Navigator>
  );
}
