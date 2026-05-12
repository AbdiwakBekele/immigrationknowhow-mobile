import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radii } from '../../../theme/layout';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

type Opt = { value: string; label: string };

export function PicklistField({
  label,
  value,
  options,
  onChange,
  placeholder,
  required,
  variant = 'default',
  disabled = false,
}: {
  label?: string;
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  /** `embedded` = no outer margin, borderless trigger (e.g. inside phone row). */
  variant?: 'default' | 'embedded';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const sheetHeading = label?.trim() ? label : 'Select';

  return (
    <View style={[styles.wrap, variant === 'embedded' && styles.wrapEmbedded]}>
      {label ? (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          variant === 'embedded' && styles.fieldEmbedded,
          disabled && styles.fieldDisabled,
          pressed && !disabled && styles.fieldPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <Text
          style={[
            styles.fieldText,
            !selected && styles.placeholder,
            variant === 'embedded' && styles.fieldTextEmbedded,
            disabled && styles.fieldTextDisabled,
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={disabled ? colors.border : colors.text.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityRole="button">
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{sheetHeading}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} />
                  ) : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  wrapEmbedded: { marginBottom: 0 },
  label: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  labelDisabled: {
    color: colors.text.muted,
  },
  requiredStar: {
    color: colors.danger,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  fieldEmbedded: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fieldPressed: { opacity: 0.92 },
  fieldDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  fieldText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary },
  fieldTextDisabled: { color: colors.text.muted },
  fieldTextEmbedded: { fontSize: typography.fontSize.sm },
  placeholder: { color: colors.text.muted },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionPressed: { backgroundColor: colors.primary[50] },
  optionText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary, paddingRight: spacing.sm },
});
