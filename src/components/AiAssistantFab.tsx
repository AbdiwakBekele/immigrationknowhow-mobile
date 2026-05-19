import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAiAssistantFabSuppressed } from '../navigation/aiAssistantFabVisibility';
import { focusedRouteChainIncludes, navigationStateHasReaderMode } from '../navigation/readerMode';
import { colors } from '../theme/colors';

const AI_ASSISTANT_ROUTE_NAMES = new Set(['AiAssistant', 'ProviderAiAssistant']);

type AiAssistantFabProps = {
  /** Seeker & advertiser: Discover → AiAssistant. Provider: Dashboard → ProviderAiAssistant. */
  variant: 'seeker' | 'provider' | 'advertiser';
};

export function AiAssistantFab({ variant }: AiAssistantFabProps) {
  const drawer = useNavigation<DrawerNavigationProp<{ Main: undefined }>>();
  const suppressedByScreen = useAiAssistantFabSuppressed();
  const [navigationHidesFab, setNavigationHidesFab] = useState(false);

  useEffect(() => {
    const syncFromNavigation = () => {
      try {
        const state = drawer.getState();
        setNavigationHidesFab(
          focusedRouteChainIncludes(state, AI_ASSISTANT_ROUTE_NAMES)
            || navigationStateHasReaderMode(state),
        );
      } catch {
        setNavigationHidesFab(false);
      }
    };

    syncFromNavigation();
    return drawer.addListener('state', syncFromNavigation);
  }, [drawer]);

  if (suppressedByScreen || navigationHidesFab) {
    return null;
  }

  function openAiAssistant() {
    if (variant === 'provider') {
      drawer.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'Dashboard',
            params: { screen: 'ProviderAiAssistant' },
          },
        }),
      );
      return;
    }

    drawer.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: {
          screen: 'Discover',
          params: { screen: 'AiAssistant' },
        },
      }),
    );
  }

  return (
    <Pressable
      onPress={openAiAssistant}
      accessibilityRole="button"
      accessibilityLabel="Open AI Assistant"
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
    >
      <Ionicons name="sparkles" size={26} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
