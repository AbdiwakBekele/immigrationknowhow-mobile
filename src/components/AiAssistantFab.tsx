import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function AiAssistantFab() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + 10 + insets.bottom;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: tabBarHeight + spacing.md }]}>
      <Pressable
        onPress={() => {
          // @ts-expect-error: app-defined route names
          navigation.navigate('Discover', { screen: 'AiAssistant' });
        }}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel="Open AI Assistant"
      >
        <Ionicons name="sparkles" size={22} color={colors.text.inverse} />
        <Text style={styles.label}>AI</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  label: {
    color: colors.text.inverse,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

