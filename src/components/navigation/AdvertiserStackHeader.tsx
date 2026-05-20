import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AppHeader } from './AppHeader';

/** Full-width stack header for advertiser screens. */
export function AdvertiserStackHeader(props: NativeStackHeaderProps) {
  return (
    <View style={styles.wrap}>
      <AppHeader {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
});
