import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { SeekerDiscoverStackParamList } from './SeekerDiscoverStack';
import type { SeekerBottomTabParamList } from '../../navigation/SeekerBottomTabs';
import { MyLibraryEntryCard } from '../../components/discover/MyLibraryEntryCard';
import { useDvLottery } from '../../context/DvLotteryContext';

type Ion = ComponentProps<typeof Ionicons>['name'];

type DiscoverNav = CompositeNavigationProp<
  NativeStackNavigationProp<SeekerDiscoverStackParamList, 'DiscoverHome'>,
  BottomTabNavigationProp<SeekerBottomTabParamList>
>;

const dvCard = {
  title: 'DV Lottery',
  screen: 'DvLottery' as const,
  icon: 'earth-outline' as Ion,
  subtitle: 'Official program info',
};

/** Mirrors web dashboard quick actions for seekers. */
const marketplaceLinks: Array<{
  title: string;
  subtitle: string;
  icon: Ion;
  iconBg: string;
  iconColor: string;
  onPress: (nav: DiscoverNav) => void;
}> = [
  {
    title: 'Find providers',
    subtitle: 'Search the marketplace',
    icon: 'search-outline',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    onPress: (nav) => nav.navigate('Providers'),
  },
  {
    title: 'My contracts',
    subtitle: 'Offers & agreements',
    icon: 'document-text-outline',
    iconBg: '#E0E7FF',
    iconColor: '#4F46E5',
    onPress: (nav) => nav.navigate('Contracts'),
  },
  {
    title: 'Messages',
    subtitle: 'Chat with providers',
    icon: 'chatbubbles-outline',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    onPress: (nav) => nav.navigate('Messages'),
  },
];

const discoverLinks: Array<{ title: string; screen: keyof SeekerDiscoverStackParamList; icon: Ion; subtitle: string }> = [
  { title: 'AI Assistant', screen: 'AiAssistant', icon: 'sparkles-outline', subtitle: 'Ask immigration questions' },
  { title: 'Videos', screen: 'Videos', icon: 'play-circle-outline', subtitle: 'Watch expert content' },
  { title: 'Community', screen: 'Community', icon: 'people-outline', subtitle: 'Posts & discussions' },
  { title: 'My Ads', screen: 'Ads', icon: 'megaphone-outline', subtitle: 'Promote your services' },
  { title: 'My reviews', screen: 'Reviews', icon: 'star-outline', subtitle: 'Your provider feedback' },
];

export function DiscoverHomeScreen() {
  const navigation = useNavigation<DiscoverNav>();
  const { showInMenu: dvInMenu } = useDvLottery();

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.lead}>Tools and content to support your immigration journey.</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Marketplace</Text>
        {marketplaceLinks.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => item.onPress(navigation)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={24} color={item.iconColor} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>Library & learning</Text>
        {dvInMenu ? (
          <Pressable
            onPress={() => navigation.navigate(dvCard.screen)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name={dvCard.icon} size={24} color={colors.primary[600]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{dvCard.title}</Text>
              <Text style={styles.cardSubtitle}>{dvCard.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
          </Pressable>
        ) : null}
        <MyLibraryEntryCard
          onPress={() => navigation.navigate('Library')}
          title="My Library"
          subtitle="E-books, audiobooks & guides"
        />

        <Text style={styles.sectionLabel}>More</Text>
        {discoverLinks.map((l) => (
          <Pressable
            key={l.screen}
            onPress={() => navigation.navigate(l.screen)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  lead: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  list: {
    marginTop: spacing.xs,
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
  cardPressed: {
    opacity: 0.92,
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
