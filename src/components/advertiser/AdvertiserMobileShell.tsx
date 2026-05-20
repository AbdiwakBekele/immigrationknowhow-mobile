import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AdvertiserLayoutProvider } from '../../context/AdvertiserLayoutContext';
import { colors } from '../../theme/colors';

const ADVERTISER_ROOT_ID = 'advertiser-app-root';

/** Full-screen advertiser shell on web and native. */
export function AdvertiserMobileShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const id = 'ikh-advertiser-web-style';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }

    style.textContent = `
      html, body, #root {
        width: 100% !important;
        max-width: 100vw !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      #${ADVERTISER_ROOT_ID} {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        flex: 1 !important;
        min-height: 100vh;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }
      #${ADVERTISER_ROOT_ID} * {
        box-sizing: border-box;
      }
      #${ADVERTISER_ROOT_ID} img,
      #${ADVERTISER_ROOT_ID} video {
        max-width: 100%;
        height: auto;
      }
      #${ADVERTISER_ROOT_ID} input,
      #${ADVERTISER_ROOT_ID} textarea,
      #${ADVERTISER_ROOT_ID} select {
        max-width: 100%;
      }
    `;
  }, []);

  return (
    <View style={styles.root}>
      <View nativeID={ADVERTISER_ROOT_ID} style={styles.frame}>
        <AdvertiserLayoutProvider>{children}</AdvertiserLayoutProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  frame: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...(Platform.OS === 'web'
      ? {
          minHeight: '100vh' as unknown as number,
        }
      : null),
  },
});
