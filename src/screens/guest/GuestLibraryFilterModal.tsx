import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type GuestLibraryFilters = {
  category: string;
  region: string;
};

export const EMPTY_GUEST_LIBRARY_FILTERS: GuestLibraryFilters = {
  category: '',
  region: '',
};

export function hasActiveGuestLibraryFilters(filters: GuestLibraryFilters): boolean {
  return !!filters.category.trim() || !!filters.region.trim();
}

export function guestLibraryFiltersToQuery(filters: GuestLibraryFilters): {
  category?: string;
  region?: string;
} {
  return {
    category: filters.category.trim() || undefined,
    region: filters.region.trim() || undefined,
  };
}

type Option = { value: string; label: string };

export function GuestLibraryFilterModal({
  visible,
  draft,
  categoryOptions,
  regionOptions,
  onChange,
  onClose,
  onApply,
  onClear,
}: {
  visible: boolean;
  draft: GuestLibraryFilters;
  categoryOptions: Option[];
  regionOptions: Option[];
  onChange: (next: GuestLibraryFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter eBooks</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close filters">
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SingleSelectPickerField
              label="Category"
              options={categoryOptions}
              value={draft.category}
              onChange={(category) => onChange({ ...draft, category })}
              placeholder="Select a category"
              pickerTitle="Categories"
              searchPlaceholder="Search categories…"
              emptyMessage="No categories match your search."
            />

            <SingleSelectPickerField
              label="Region"
              options={regionOptions}
              value={draft.region}
              onChange={(region) => onChange({ ...draft, region })}
              placeholder="Select a region"
              pickerTitle="Regions"
              searchPlaceholder="Search regions…"
              emptyMessage="No regions match your search."
            />
          </ScrollView>

          <View style={styles.actions}>
            <AppButton title="Clear" variant="ghost" onPress={onClear} style={styles.actionButton} />
            <AppButton title="Apply filters" onPress={onApply} style={styles.actionButton} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SingleSelectPickerField({
  label,
  options,
  value,
  onChange,
  placeholder,
  pickerTitle,
  searchPlaceholder,
  emptyMessage,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  pickerTitle: string;
  searchPlaceholder: string;
  emptyMessage: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = options.find((option) => option.value === value)?.label;
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.sectionLabel}>{label}</Text>

      {selectedLabel ? (
        <View style={styles.selectedBubbleRow}>
          <View style={styles.selectedBubble}>
            <Text style={styles.selectedBubbleText} numberOfLines={2}>
              {selectedLabel}
            </Text>
            <Pressable
              onPress={() => onChange('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${selectedLabel}`}
              style={styles.selectedBubbleRemove}
            >
              <Ionicons name="close" size={16} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          setQuery('');
          setPickerOpen(true);
        }}
        style={styles.dropdownTrigger}
        accessibilityRole="button"
        accessibilityLabel={`Open ${label} selector`}
      >
        <Text style={[styles.dropdownTriggerText, !selectedLabel && styles.dropdownPlaceholder]} numberOfLines={1}>
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
      </Pressable>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.pickerBackdrop}>
          <Pressable style={styles.pickerDismiss} onPress={() => setPickerOpen(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerTitle}</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                <Text style={styles.pickerDone}>Done</Text>
              </Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.text.muted}
              style={styles.pickerSearch}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.pickerEmpty}>{emptyMessage}</Text>}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(selected ? '' : item.value);
                      setPickerOpen(false);
                    }}
                    style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                  >
                    <Text style={[styles.pickerRowText, selected && styles.pickerRowTextSelected]}>{item.label}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  scroll: {
    maxHeight: 420,
  },
  fieldBlock: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectedBubbleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: '#eff6ff',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: 6,
    gap: 4,
  },
  selectedBubbleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flexShrink: 1,
  },
  selectedBubbleRemove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: 46,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    paddingRight: spacing.sm,
  },
  dropdownPlaceholder: {
    color: colors.text.muted,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  pickerDismiss: {
    flex: 1,
  },
  pickerSheet: {
    maxHeight: '72%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  pickerDone: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  pickerSearch: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowSelected: {
    backgroundColor: '#f8fafc',
  },
  pickerRowText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    paddingRight: spacing.md,
  },
  pickerRowTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  pickerEmpty: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
