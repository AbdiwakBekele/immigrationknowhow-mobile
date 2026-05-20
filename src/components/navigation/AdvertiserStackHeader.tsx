import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useAdvertiserLayout } from '../../context/AdvertiserLayoutContext';
import { AppHeader } from './AppHeader';

/** Keeps stack headers inside the advertiser phone-width frame on web and tablet. */
export function AdvertiserStackHeader(props: NativeStackHeaderProps) {
  const { frameWidth } = useAdvertiserLayout();

  return (
    <View style={[styles.wrap, { maxWidth: frameWidth }]}>
      <AppHeader {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
