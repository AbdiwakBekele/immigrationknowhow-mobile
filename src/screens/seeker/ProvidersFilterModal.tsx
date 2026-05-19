import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { ProvidersQuery } from '../../api/providersApi';

export type ProviderFilters = {
  service_types: string[];
  languages: string[];
  location: string;
  remote_only: boolean;
  free_consultation: boolean;
  sort: NonNullable<ProvidersQuery['sort']>;
};

export const EMPTY_PROVIDER_FILTERS: ProviderFilters = {
  service_types: [],
  languages: [],
  location: '',
  remote_only: false,
  free_consultation: false,
  sort: 'rating',
};

const SORT_OPTIONS: Array<{ value: ProviderFilters['sort']; label: string }> = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'newest', label: 'Newest' },
  { value: 'experience', label: 'Most experience' },
];

export function hasActiveProviderFilters(filters: ProviderFilters): boolean {
  return (
    filters.service_types.length > 0 ||
    filters.languages.length > 0 ||
    !!filters.location.trim() ||
    filters.remote_only ||
    filters.free_consultation ||
    filters.sort !== 'rating'
  );
}

export function providerFiltersToQuery(filters: ProviderFilters): ProvidersQuery {
  return {
    service_types: filters.service_types.length > 0 ? filters.service_types : undefined,
    languages: filters.languages.length > 0 ? filters.languages : undefined,
    location: filters.location.trim() || undefined,
    remote_only: filters.remote_only || undefined,
    free_consultation: filters.free_consultation || undefined,
    sort: filters.sort,
  };
}

type Option = { value: string; label: string };

export function ProvidersFilterModal({
  visible,
  draft,
  serviceTypeOptions,
  languageOptions,
  onChange,
  onClose,
  onApply,
  onClear,
}: {
  visible: boolean;
  draft: ProviderFilters;
  serviceTypeOptions: Option[];
  languageOptions: Option[];
  onChange: (next: ProviderFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter providers</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close filters">
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <MultiSelectDropdownField
              label="Service type"
              options={serviceTypeOptions}
              selectedValues={draft.service_types}
              onChange={(service_types) => onChange({ ...draft, service_types })}
              placeholder="Select service types"
              pickerTitle="Service types"
              searchPlaceholder="Search service types…"
              emptyMessage="No service types match your search."
              countLabel="service type"
            />

            <Text style={styles.sectionLabel}>Location</Text>
            <TextInput
              value={draft.location}
              onChangeText={(location) => onChange({ ...draft, location })}
              placeholder="City or state"
              placeholderTextColor={colors.text.muted}
              style={styles.textInput}
              autoCapitalize="words"
            />

            <MultiSelectDropdownField
              label="Language"
              options={languageOptions}
              selectedValues={draft.languages}
              onChange={(languages) => onChange({ ...draft, languages })}
              placeholder="Select languages"
              pickerTitle="Languages"
              searchPlaceholder="Search languages…"
              emptyMessage="No languages match your search."
              countLabel="language"
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Remote only</Text>
                <Text style={styles.toggleHint}>Providers who serve clients remotely</Text>
              </View>
              <Switch
                value={draft.remote_only}
                onValueChange={(remote_only) => onChange({ ...draft, remote_only })}
                trackColor={{ false: '#cbd5e1', true: colors.primary[200] }}
                thumbColor={draft.remote_only ? colors.primary[600] : '#f8fafc'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Free consultation</Text>
                <Text style={styles.toggleHint}>Providers offering a free initial consult</Text>
              </View>
              <Switch
                value={draft.free_consultation}
                onValueChange={(free_consultation) => onChange({ ...draft, free_consultation })}
                trackColor={{ false: '#cbd5e1', true: colors.primary[200] }}
                thumbColor={draft.free_consultation ? colors.primary[600] : '#f8fafc'}
              />
            </View>

            <SingleSelectDropdownField
              label="Sort by"
              options={SORT_OPTIONS}
              value={draft.sort}
              onChange={(sort) => onChange({ ...draft, sort: sort as ProviderFilters['sort'] })}
              placeholder="Choose sort order"
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

function MultiSelectDropdownField({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  pickerTitle,
  searchPlaceholder,
  emptyMessage,
  countLabel,
}: {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  pickerTitle: string;
  searchPlaceholder: string;
  emptyMessage: string;
  countLabel: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of options) {
      map.set(option.value, option.label);
    }
    return map;
  }, [options]);

  const selectedChips = useMemo(
    () =>
      selectedValues.map((value) => ({
        value,
        label: labelByValue.get(value) ?? value,
      })),
    [selectedValues, labelByValue],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const dropdownLabel =
    selectedValues.length === 0
      ? placeholder
      : `${selectedValues.length} ${countLabel}${selectedValues.length === 1 ? '' : 's'} selected`;

  function toggleValue(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  }

  function removeValue(value: string) {
    onChange(selectedValues.filter((item) => item !== value));
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.sectionLabel}>{label}</Text>

      {selectedChips.length > 0 ? (
        <View style={styles.selectedBubbleRow}>
          {selectedChips.map((chip) => (
            <View key={chip.value} style={styles.selectedBubble}>
              <Text style={styles.selectedBubbleText} numberOfLines={2}>
                {chip.label}
              </Text>
              <Pressable
                onPress={() => removeValue(chip.value)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${chip.label}`}
                style={styles.selectedBubbleRemove}
              >
                <Ionicons name="close" size={16} color={colors.text.secondary} />
              </Pressable>
            </View>
          ))}
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
        <Text style={[styles.dropdownTriggerText, selectedValues.length === 0 && styles.dropdownPlaceholder]} numberOfLines={1}>
          {dropdownLabel}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
      </Pressable>

      <FilterPickerSheet
        visible={pickerOpen}
        title={pickerTitle}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setPickerOpen(false)}
        options={filteredOptions}
        renderTrailing={(item) =>
          selectedValues.includes(item.value) ? <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} /> : null
        }
        isSelected={(item) => selectedValues.includes(item.value)}
        onSelect={(item) => toggleValue(item.value)}
      />
    </View>
  );
}

function SingleSelectDropdownField({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label;
  const displayLabel = selectedLabel ?? placeholder;
  const hasSelection = !!selectedLabel;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.inlineDropdown}>
        <Pressable
          onPress={() => setOpen((current) => !current)}
          style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${label}. ${open ? 'Expanded' : 'Collapsed'}`}
        >
          <Text
            style={[styles.dropdownTriggerText, !hasSelection && styles.dropdownPlaceholder]}
            numberOfLines={1}
          >
            {displayLabel}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.secondary} />
        </Pressable>

        {open ? (
          <View style={styles.inlineOptionsList}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.inlineOptionRow, selected && styles.inlineOptionRowSelected]}
                >
                  <Text style={[styles.inlineOptionText, selected && styles.inlineOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FilterPickerSheet({
  visible,
  title,
  searchPlaceholder,
  emptyMessage,
  query,
  onQueryChange,
  onClose,
  options,
  renderTrailing,
  isSelected,
  onSelect,
}: {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  options: Option[];
  renderTrailing: (item: Option) => React.ReactNode;
  isSelected: (item: Option) => boolean;
  onSelect: (item: Option) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.pickerBackdrop}>
        <Pressable style={styles.pickerDismiss} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.pickerDone}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.text.muted}
            style={styles.pickerSearch}
            autoCapitalize="none"
          />
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.pickerEmpty}>{emptyMessage}</Text>}
            renderItem={({ item }) => {
              const selected = isSelected(item);
              return (
                <Pressable onPress={() => onSelect(item)} style={[styles.pickerRow, selected && styles.pickerRowSelected]}>
                  <Text style={[styles.pickerRowText, selected && styles.pickerRowTextSelected]}>{item.label}</Text>
                  {renderTrailing(item)}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
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
  inlineDropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: 46,
  },
  dropdownTriggerOpen: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inlineOptionsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inlineOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inlineOptionRowSelected: {
    backgroundColor: '#f8fafc',
  },
  inlineOptionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    paddingRight: spacing.md,
  },
  inlineOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
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
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  toggleRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  toggleHint: {
    marginTop: 2,
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
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
