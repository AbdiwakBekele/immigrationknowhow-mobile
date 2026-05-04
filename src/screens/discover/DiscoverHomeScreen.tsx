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
import type { SeekerDiscoverStackParamList } from './SeekerDiscoverStack';
import { MyLibraryEntryCard } from '../../components/discover/MyLibraryEntryCard';

type Ion = ComponentProps<typeof Ionicons>['name'];

const links: Array<{ title: string; screen: keyof SeekerDiscoverStackParamList; icon: Ion; subtitle: string }> = [
  { title: 'DV Lottery', screen: 'DvLottery', icon: 'earth-outline', subtitle: 'Official program info' },
  { title: 'AI Assistant', screen: 'AiAssistant', icon: 'sparkles-outline', subtitle: 'Ask immigration questions' },
  { title: 'Videos', screen: 'Videos', icon: 'play-circle-outline', subtitle: 'Watch expert content' },
  { title: 'Community', screen: 'Community', icon: 'people-outline', subtitle: 'Posts & discussions' },
  { title: 'My Ads', screen: 'Ads', icon: 'megaphone-outline', subtitle: 'Promote your services' },
  { title: 'My reviews', screen: 'Reviews', icon: 'star-outline', subtitle: 'Your provider feedback' },
];

export function DiscoverHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SeekerDiscoverStackParamList>>();

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <Text style={styles.lead}>Tools and content to support your immigration journey.</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {(() => {
          const [dv, ...rest] = links;
          return (
            <>
              <Pressable
                key={dv.screen}
                onPress={() => navigation.navigate(dv.screen as never)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={dv.icon} size={24} color={colors.primary[600]} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{dv.title}</Text>
                  <Text style={styles.cardSubtitle}>{dv.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
              </Pressable>
              <MyLibraryEntryCard
                onPress={() => navigation.navigate('Library')}
                title="My Library"
                subtitle="Guides & resources — tap to browse"
              />
              {rest.map((l) => (
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
            </>
          );
        })()}
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
