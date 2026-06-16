import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function PaymentCtaButton({
  label,
  onPress,
  disabled,
  loading,
  loadingLabel = 'Processing…',
  style,
}: Props) {
  const inactive = Boolean(disabled) || Boolean(loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={[styles.button, inactive && styles.buttonDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name="card-outline" size={18} color="#fff" />
      )}
      <Text style={styles.label} numberOfLines={1}>
        {loading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 1,
  },
});
