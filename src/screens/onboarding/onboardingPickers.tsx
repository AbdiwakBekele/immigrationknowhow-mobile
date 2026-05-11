import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import {
  USER_SELECT_SERVICES_LATER_LABEL,
  USER_SELECT_SERVICES_LATER_VALUE,
  canonicalUserServiceTypeValue,
} from './onboardingConstants';

export type LabeledOption = { value: string; label: string };

type FilterableSingleSelectProps = {
  label: string;
  value: string | null | undefined;
  options: LabeledOption[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function FilterableSingleSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tap to choose',
}: FilterableSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)
    );
  }, [options, q]);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          marginBottom: spacing.xs,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        }}
      >
        <Text style={{ fontSize: typography.fontSize.md, color: selectedLabel ? colors.text.primary : colors.text.secondary }}>
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={{
              maxHeight: '72%',
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              paddingBottom: spacing.lg,
            }}
          >
            <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold }}>
                  {label}
                </Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>Done</Text>
                </Pressable>
              </View>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search…"
                placeholderTextColor={colors.text.muted}
                style={{
                  marginTop: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                }}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: typography.fontSize.md, color: colors.text.primary }}>{item.label}</Text>
                  {item.value === value ? <Ionicons name="checkmark" size={20} color={colors.primary[600]} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

type UserServicesTagFieldProps = {
  label: string;
  /** Shown on the in-field “add” control (web-style combobox). */
  placeholder?: string;
  options: LabeledOption[];
  /** Stored canonical values (same order as selection). */
  selectedValues: string[];
  onToggle: (value: string, label: string) => void;
  limitError?: string;
  maxSelections?: number;
};

/**
 * Selected services as removable bubbles above an inline expandable dropdown (multi-select, no modal).
 */
export function UserServicesTagField({
  label,
  placeholder = 'Choose a service to add',
  options,
  selectedValues,
  onToggle,
  limitError,
  maxSelections = 8,
}: UserServicesTagFieldProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selectedChips = useMemo(() => {
    return selectedValues.map((val) => {
      const opt = options.find(
        (o) => canonicalUserServiceTypeValue(String(o.value), o.label) === val
      );
      const lab =
        val === USER_SELECT_SERVICES_LATER_VALUE
          ? USER_SELECT_SERVICES_LATER_LABEL
          : opt?.label ?? val;
      return { value: val, label: lab };
    });
  }, [selectedValues, options]);

  const realCount = selectedValues.filter((v) => v !== USER_SELECT_SERVICES_LATER_VALUE).length;
  const atMax = realCount >= maxSelections;

  const filteredOptions = useMemo(() => {
    const t = q.trim().toLowerCase();
    return options.filter((o) => {
      if (!t) return true;
      return o.label.toLowerCase().includes(t) || String(o.value).toLowerCase().includes(t);
    });
  }, [options, q]);

  const toggleDropdown = () => {
    setOpen((v) => {
      if (v) setQ('');
      return !v;
    });
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          marginBottom: spacing.xs,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        {label}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        {selectedChips.map((chip) => (
          <View
            key={`${chip.value}-${chip.label}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              maxWidth: '100%',
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.primary[200],
              backgroundColor: colors.primary[50],
              paddingLeft: spacing.md,
              paddingRight: spacing.xs,
              paddingVertical: 6,
              gap: 6,
            }}
          >
            <Text
              style={{ fontSize: typography.fontSize.sm, color: colors.text.primary, flexShrink: 1 }}
              numberOfLines={2}
            >
              {chip.label}
            </Text>
            <Pressable
              onPress={() => onToggle(chip.value, chip.label)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${chip.label}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>
        ))}
      </View>

      <View
        style={{
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => toggleDropdown()}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${placeholder}. ${open ? 'Expanded' : 'Collapsed'}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Platform.OS === 'ios' ? 14 : 12,
            paddingHorizontal: spacing.md,
            minHeight: Platform.OS === 'ios' ? 48 : 46,
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.md,
              flex: 1,
              paddingRight: spacing.sm,
              color: atMax ? colors.text.muted : colors.text.secondary,
            }}
            numberOfLines={1}
          >
            {atMax ? `Maximum ${maxSelections} services — remove one to add more` : placeholder}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.secondary} />
        </Pressable>

        {open ? (
          <>
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.sm,
              }}
            >
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search…"
                placeholderTextColor={colors.text.muted}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                }}
              />
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                maxHeight: 260,
              }}
            >
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredOptions.length === 0 ? (
                  <Text style={{ padding: spacing.lg, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    No matching services.
                  </Text>
                ) : (
                  filteredOptions.map((item) => {
                    const canon = canonicalUserServiceTypeValue(String(item.value), item.label);
                    const isSelected = selectedValues.includes(canon);
                    const addBlocked = !isSelected && atMax && canon !== USER_SELECT_SERVICES_LATER_VALUE;
                    return (
                      <Pressable
                        key={`${item.value}-${item.label}`}
                        onPress={() => {
                          if (addBlocked) return;
                          onToggle(String(item.value), String(item.label ?? ''));
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected, disabled: addBlocked }}
                        style={{
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.lg,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing.sm,
                          opacity: addBlocked ? 0.45 : 1,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary }}>
                          {item.label}
                        </Text>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isSelected ? colors.primary[600] : colors.text.secondary}
                        />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </>
        ) : null}
      </View>

      {limitError ? (
        <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm, color: colors.danger }}>
          {limitError}
        </Text>
      ) : null}
    </View>
  );
}
