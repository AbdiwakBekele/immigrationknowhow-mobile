import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ViewStyle } from 'react-native';

/** Forces tab/stack scenes to stay within the advertiser phone-width frame. */
export const advertiserSceneStyle: ViewStyle = {
  flex: 1,
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
};

export const advertiserStackScreenOptions: NativeStackNavigationOptions = {
  contentStyle: advertiserSceneStyle,
};

export const advertiserTabScreenOptions: BottomTabNavigationOptions = {
  sceneStyle: advertiserSceneStyle,
};
