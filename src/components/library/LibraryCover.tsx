import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../AppImage';
import { colors } from '../../theme/colors';

type Props = {
  uri: string | null | undefined;
  width: number;
  height: number;
  borderRadius: number;
};

/**
 * Renders a cover image if available; otherwise shows a blue gradient fallback.
 * Also falls back to gradient if the remote image fails to load.
 */
export function LibraryCover({ uri, width, height, borderRadius }: Props) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [uri]);
  const has = typeof uri === 'string' && uri.trim() !== '' && !failed;

  return (
    <View style={[styles.shell, { width, height, borderRadius }]}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#0EA5E9']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {has ? (
        <AppImage
          uri={uri}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
          contentFit="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={Math.max(18, Math.round(height * 0.32))} color="rgba(255,255,255,0.95)" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

