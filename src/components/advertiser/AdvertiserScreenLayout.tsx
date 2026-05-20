import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppScreen } from '../AppScreen';
import { useAdvertiserStyles } from '../../context/AdvertiserLayoutContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fill?: boolean;
};

export function AdvertiserScreenLayout({ children, style, fill = true }: Props) {
  const ui = useAdvertiserStyles();

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <View style={[ui.page, fill && styles.fill, style]}>{children}</View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
});
