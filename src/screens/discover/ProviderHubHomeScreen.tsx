import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { ProviderHubStackParamList } from './ProviderHubStack';
import { MyLibraryEntryCard } from '../../components/discover/MyLibraryEntryCard';

type Ion = ComponentProps<typeof Ionicons>['name'];

const dvCard = {
  title: 'DV Lottery',
  screen: 'DvLottery' as const,
  icon: 'earth-outline' as Ion,
  subtitle: 'Program timelines & links',
};

const hubLinks: Array<{ title: string; screen: keyof ProviderHubStackParamList; icon: Ion; subtitle: string }> = [
  { title: 'Community', screen: 'Community', icon: 'people-outline', subtitle: 'Industry discussions' },
  { title: 'My Ads', screen: 'Ads', icon: 'megaphone-outline', subtitle: 'Manage campaigns' },
];

export function ProviderHubHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProviderHubStackParamList>>();

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <Text style={styles.lead}>Extras beyond your provider dashboard.</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => navigation.navigate(dvCard.screen as never)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={dvCard.icon} size={24} color={colors.primary[600]} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{dvCard.title}</Text>
            <Text style={styles.cardSubtitle}>{dvCard.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
        </Pressable>
        <MyLibraryEntryCard
          onPress={() => navigation.navigate('Library')}
          title="My Library"
          subtitle="Resources for your clients — tap to open"
        />
        {hubLinks.map((l) => (
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
