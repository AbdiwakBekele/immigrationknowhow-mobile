import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/layout';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function AppButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary[600]
      : variant === 'secondary'
        ? colors.secondary[500]
        : 'transparent';

  const borderColor = variant === 'ghost' ? colors.border : 'transparent';

  const textColor = variant === 'ghost' ? colors.primary[700] : colors.text.inverse;

  const disabledBg =
    variant === 'primary'
      ? colors.primary[300]
      : variant === 'secondary'
        ? colors.secondary[200]
        : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={
        variant === 'ghost' ? { color: `${colors.primary[600]}22` } : { color: '#ffffff44' }
      }
      style={({ pressed }) => [
        {
          backgroundColor: isDisabled ? disabledBg : backgroundColor,
          borderColor,
          borderWidth: variant === 'ghost' ? 1 : 0,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.md,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed && !isDisabled ? (variant === 'ghost' ? 0.85 : 0.92) : 1,
          ...Platform.select({
            ios: {
              shadowColor: variant === 'ghost' ? 'transparent' : colors.primary[900],
              shadowOpacity: variant === 'ghost' ? 0 : 0.2,
              shadowRadius: variant === 'ghost' ? 0 : 8,
              shadowOffset: { width: 0, height: 4 },
            },
            default: {},
          }),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
