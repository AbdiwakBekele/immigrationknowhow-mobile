import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AdvertiserLayoutProvider } from '../../context/AdvertiserLayoutContext';
import { STRICT_MOBILE_MAX_WIDTH } from '../../theme/responsive';
import { colors } from '../../theme/colors';

const ADVERTISER_ROOT_ID = 'advertiser-app-root';

/**
 * Phone-first shell: 100% width on device, max 480px centered on desktop web.
 */
export function AdvertiserMobileShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const id = 'ikh-advertiser-web-style';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      html, body, #root {
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
      #${ADVERTISER_ROOT_ID} {
        width: 100% !important;
        max-width: ${STRICT_MOBILE_MAX_WIDTH}px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        flex: 1 !important;
        min-height: 100%;
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
    document.head.appendChild(style);
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
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
    overflow: 'hidden',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: STRICT_MOBILE_MAX_WIDTH,
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...(Platform.OS === 'web'
      ? {
          minHeight: '100vh' as unknown as number,
        }
      : null),
  },
});
