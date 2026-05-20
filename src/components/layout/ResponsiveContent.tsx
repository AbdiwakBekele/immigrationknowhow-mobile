import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fill?: boolean;
};

/** Centers page content and caps width on tablets / wide web viewports. */
export function ResponsiveContent({ children, style, fill = true }: Props) {
  const { paddingX, contentMaxWidth, width } = useResponsiveLayout();

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.inner,
          fill && styles.innerFill,
          {
            paddingHorizontal: paddingX,
            maxWidth: Math.min(contentMaxWidth, width),
          },
          Platform.OS === 'web' && styles.innerWeb,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    minWidth: 0,
  },
  inner: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  innerFill: {
    flex: 1,
  },
  innerWeb: {
    boxSizing: 'border-box' as unknown as undefined,
  },
});
