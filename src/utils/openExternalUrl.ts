import { Alert, Linking } from 'react-native';

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Link', 'Unable to open link. Please try again.');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Link', 'Unable to open link. Please try again.');
    return false;
  }
}
