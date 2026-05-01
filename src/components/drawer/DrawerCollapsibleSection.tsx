import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Ion = ComponentProps<typeof Ionicons>['name'];

export function DrawerCollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  /** When false, section starts collapsed. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.sectionWrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.sectionHeaderPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${open ? 'expanded' : 'collapsed'}`}
      >
        <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={18} color="rgba(255,255,255,0.75)" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

export function DrawerGradientLink({
  icon,
  label,
  onPress,
  indent = false,
}: {
  icon: Ion;
  label: string;
  onPress: () => void;
  indent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.link, indent && styles.linkIndent, pressed && styles.linkPressed]}
      accessibilityRole="button"
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={indent ? 20 : 22} color={colors.primary[100]} />
      </View>
      <Text style={[styles.linkText, indent && styles.linkTextSub]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.45)" />
    </Pressable>
  );
}

export const drawerBrandStyles = StyleSheet.create({
  brand: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
  brandSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
});

export const drawerScrollPadding = {
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing['3xl'],
};

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  sectionHeaderPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingLeft: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    marginBottom: 2,
  },
  linkIndent: {
    paddingVertical: spacing.sm,
  },
  linkPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  linkIcon: {
    width: 36,
    alignItems: 'center',
  },
  linkText: {
    flex: 1,
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  linkTextSub: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
