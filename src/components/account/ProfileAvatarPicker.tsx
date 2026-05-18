import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  avatarUrl?: string | null;
  initials: string;
  busy?: boolean;
  onPick: () => void;
  onRemove?: () => void;
  size?: number;
  /** Ring around the + button; match the profile card background. */
  badgeBorderColor?: string;
};

export function ProfileAvatarPicker({
  avatarUrl,
  initials,
  busy = false,
  onPick,
  onRemove,
  size = 76,
  badgeBorderColor = '#EEF4FF',
}: Props) {
  const radius = size / 2;
  const badgeSize = Math.round(size * 0.36);

  return (
    <View style={styles.wrap}>
      <View style={[styles.avatarShell, { width: size, height: size }]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.surface }}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <Pressable
          onPress={onPick}
          disabled={busy}
          style={({ pressed }) => [
            styles.addButton,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderColor: badgeBorderColor,
              right: -2,
              bottom: -2,
            },
            pressed && !busy && styles.addButtonPressed,
            busy && styles.addButtonBusy,
          ]}
          accessibilityRole="button"
          accessibilityLabel={avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Ionicons name="add" size={Math.round(badgeSize * 0.62)} color={colors.text.inverse} />
          )}
        </Pressable>
      </View>
      {avatarUrl && onRemove ? (
        <Pressable
          onPress={onRemove}
          disabled={busy}
          hitSlop={8}
          style={({ pressed }) => [styles.removeLink, pressed && styles.removeLinkPressed, busy && styles.removeLinkBusy]}
          accessibilityRole="button"
          accessibilityLabel="Remove profile photo"
        >
          <Text style={styles.removeLinkText}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  avatarShell: {
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  initials: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  addButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderWidth: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonPressed: {
    opacity: 0.88,
  },
  addButtonBusy: {
    opacity: 0.75,
  },
  removeLink: {
    marginTop: spacing.xs,
    paddingVertical: 2,
  },
  removeLinkPressed: {
    opacity: 0.7,
  },
  removeLinkBusy: {
    opacity: 0.5,
  },
  removeLinkText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
});
