import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type GuestChipOption = { value: string; label: string };

type Props = {
  options: GuestChipOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  allLabel?: string;
};

export function GuestChipRow({ options, selected, onSelect, allLabel = 'All' }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, selected === null && styles.chipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === null }}
      >
        <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>{allLabel}</Text>
      </Pressable>
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(active ? null : option.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function GuestActiveFiltersRow({
  labels,
  onClear,
}: {
  labels: string[];
  onClear: () => void;
}) {
  if (labels.length === 0) return null;

  return (
    <View style={styles.activeRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeScroll}>
        {labels.map((label) => (
          <View key={label} style={styles.activePill}>
            <Text style={styles.activePillText} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
      <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear filters">
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    maxWidth: 220,
  },
  chipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.primary[800],
    fontWeight: typography.fontWeight.semibold,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  activeScroll: {
    gap: spacing.xs,
    paddingLeft: spacing.lg,
  },
  activePill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primary[100],
  },
  activePillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[800],
    maxWidth: 160,
  },
  clearText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
});
