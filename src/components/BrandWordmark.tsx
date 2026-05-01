import React from 'react';
import { View } from 'react-native';
import LogoSvg from '../../assets/brand/logo.svg';

/** Same wordmark as the web dashboard sidebar (`public/images/logo.svg`). */
export function BrandWordmark({ width = 240 }: { width?: number }) {
  const aspect = 715 / 2146;
  const height = Math.round(width * aspect);

  return (
    <View style={{ alignSelf: 'center', marginBottom: 8 }}>
      <LogoSvg width={width} height={height} accessibilityRole="image" accessibilityLabel="ImmigrationKnowHow" />
    </View>
  );
}
