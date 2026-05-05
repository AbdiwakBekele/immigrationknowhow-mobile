import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '../theme/colors';
import { radii } from '../theme/layout';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type IonName = ComponentProps<typeof Ionicons>['name'];

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  leftIcon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | null;
  leftIcon?: IonName;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {leftIcon ? (
          <View style={styles.iconSlot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name={leftIcon} size={20} color={colors.text.muted} />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
        />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.15,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    minHeight: 52,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 2px 6px rgba(15, 23, 42, 0.04)',
        }
      : {
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }),
  },
  fieldError: {
    borderColor: colors.danger,
  },
  iconSlot: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
});
