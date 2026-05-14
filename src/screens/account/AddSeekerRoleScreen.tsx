import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { useAuth } from '../../context/AuthContext';
import * as rolesApi from '../../api/rolesApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import type { ProfileStackParamList } from './ProfileStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function AddSeekerRoleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { refreshMe, setActiveRole } = useAuth();
  const [childrenCount, setChildrenCount] = useState('');
  const [childrenAges, setChildrenAges] = useState('');
  const [dogsCount, setDogsCount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const payload: rolesApi.EnableSeekerPayload = {
      number_of_children: childrenCount.trim() === '' ? null : parseInt(childrenCount, 10),
      children_ages_text: childrenAges.trim() || null,
      dogs_count: dogsCount.trim() === '' ? null : parseInt(dogsCount, 10),
    };
    const res = await rolesApi.enableSeeker(payload);
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    await refreshMe();
    await setActiveRole('user');
    navigation.goBack();
  };

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create service seeker account</Text>
        <Text style={styles.subtitle}>
          Your name, contact details, and location are already on file. Add household details so providers can match your needs.
        </Text>

        <View style={styles.card}>
          <AppInput
            label="Number of children"
            value={childrenCount}
            onChangeText={setChildrenCount}
            keyboardType="numeric"
            placeholder="0"
          />
          <AppInput
            label="Children ages"
            value={childrenAges}
            onChangeText={setChildrenAges}
            placeholder="e.g. 4, 9"
          />
          <AppInput
            label="Number of pets"
            value={dogsCount}
            onChangeText={setDogsCount}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppButton title="Create seeker account" onPress={() => void onSubmit()} loading={busy} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
  },
});
