import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as guestApi from '../../api/guestApi';

export function GuestHowItWorksScreen() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('How it works');
  const [steps, setSteps] = useState<Array<{ title: string; description: string }>>([]);

  useEffect(() => {
    void (async () => {
      const res = await guestApi.getHowItWorks();
      setLoading(false);
      if (res.success) {
        setTitle(res.data.title);
        setSteps(res.data.steps ?? []);
      }
    })();
  }, []);

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.intro}>
            Browse service providers and educational resources as a guest. Create an account when you are ready to connect, purchase, or save your progress.
          </Text>
          {steps.map((step, index) => (
            <View key={step.title} style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  intro: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
