import React from 'react';
import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/layout';

type Props = {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps['contentFit'];
  height?: number;
};

/**
 * Remote images with caching and smooth decode (prefer over RN Image for URLs).
 */
export function AppImage({ uri, style, contentFit = 'cover', height }: Props) {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  if (!trimmed) return null;

  return (
    <Image
      source={{ uri: trimmed }}
      style={[styles.base, height != null ? { height } : null, style]}
      contentFit={contentFit}
      transition={220}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
});
