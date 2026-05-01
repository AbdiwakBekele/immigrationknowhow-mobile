import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppScreen } from '../../components/AppScreen';
import { DrawerMenuButton } from '../../components/DrawerMenuButton';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { ProviderHubStackParamList } from './ProviderHubStack';

type Ion = ComponentProps<typeof Ionicons>['name'];

const links: Array<{ title: string; screen: keyof ProviderHubStackParamList; icon: Ion; subtitle: string }> = [
  { title: 'DV Lottery', screen: 'DvLottery', icon: 'earth-outline', subtitle: 'Program timelines & links' },
  { title: 'Library', screen: 'Library', icon: 'library-outline', subtitle: 'Resources for your clients' },
  { title: 'Community', screen: 'Community', icon: 'people-outline', subtitle: 'Industry discussions' },
  { title: 'Sponsored ads', screen: 'Ads', icon: 'megaphone-outline', subtitle: 'Manage campaigns' },
];

export function ProviderHubHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProviderHubStackParamList>>();

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <View style={styles.titleRow}>
        <DrawerMenuButton />
        <Text style={styles.title}>More</Text>
      </View>
      <Text style={styles.lead}>Extras beyond your provider dashboard.</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {links.map((l) => (
          <Pressable
            key={l.screen}
            onPress={() => navigation.navigate(l.screen as never)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={l.icon} size={24} color={colors.primary[600]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{l.title}</Text>
              <Text style={styles.cardSubtitle}>{l.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  lead: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
