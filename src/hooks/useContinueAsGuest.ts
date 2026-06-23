import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { GuestStackParamList } from '../navigation/GuestNavigator';

export function useContinueAsGuest() {
  const { isGuest, enterGuestMode } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();

  return useCallback(async () => {
    if (isGuest) {
      navigation.navigate('GuestTabs');
      return;
    }
    await enterGuestMode();
  }, [isGuest, enterGuestMode, navigation]);
}
