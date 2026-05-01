import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function DrawerMenuButton({ iconColor = colors.text.primary }: { iconColor?: string }) {
  const navigation = useNavigation();

  const open = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  return (
    <Pressable onPress={open} hitSlop={12} style={styles.btn} accessibilityRole="button" accessibilityLabel="Open menu">
      <Ionicons name="menu" size={26} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
    marginRight: 8,
  },
});
