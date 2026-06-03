import { Platform } from 'react-native';

/** Digital goods on iOS must use Apple In-App Purchase (App Store Guideline 3.1.1). */
export function shouldUseAppleIap(): boolean {
  return Platform.OS === 'ios';
}
