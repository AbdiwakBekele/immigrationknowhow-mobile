import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { ProviderProfileScreen } from './ProviderProfileScreen';
import { typography } from '../../theme/typography';
import * as onboardingApi from '../../api/onboardingApi';
import { shadows } from '../../theme/shadows';

export function ProfileScreen() {
  const { user, role, signOut, refreshMe } = useAuth();
  const formLoadedRef = useRef(false);
  const [meta, setMeta] = useState<onboardingApi.OnboardingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  if (role === 'provider') {
    return <ProviderProfileScreen />;
  }

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await onboardingApi.meta();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setMeta(res.data);
    if (!formLoadedRef.current) {
      setFirstName((user?.first_name ?? '').trim());
      setLastName((user?.last_name ?? '').trim());
      setEmail((user?.email ?? '').trim());
      setPhone((user?.phone ?? '').trim());
      setCity((user?.city ?? '').trim());
      setState((user?.state ?? '').trim());
      setCountry((user?.country ?? '').trim());
      setPostalCode(String(res.data.existingData?.location?.postal_code ?? '').trim());
      setPreferredLanguage((String((user as { preferred_language?: string } | null)?.preferred_language ?? '').trim() || 'en').toLowerCase());
      formLoadedRef.current = true;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || 'Profile';
  const hasDirtyFields = useMemo(
    () =>
      firstName.trim() !== (user?.first_name ?? '').trim() ||
      lastName.trim() !== (user?.last_name ?? '').trim() ||
      email.trim() !== (user?.email ?? '').trim() ||
      phone.trim() !== (user?.phone ?? '').trim() ||
      city.trim() !== (user?.city ?? '').trim() ||
      state.trim() !== (user?.state ?? '').trim() ||
      country.trim() !== (user?.country ?? '').trim() ||
      preferredLanguage.trim() !== String((user as { preferred_language?: string } | null)?.preferred_language ?? '').trim().toLowerCase() ||
      postalCode.trim() !== String(meta?.existingData?.location?.postal_code ?? '').trim(),
    [user, meta, firstName, lastName, email, phone, city, state, country, preferredLanguage, postalCode]
  );

  const onSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    const res = await onboardingApi.sendOtp({
      address: '',
      city: city.trim(),
      state: state.trim(),
      country: country.trim().toUpperCase(),
      postal_code: postalCode.trim() || null,
      preferred_language: preferredLanguage.trim().toLowerCase() || 'en',
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setSaveMessage('Saved');
    await refreshMe();
  };

  return (
    <AppScreen variant="gradient" style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>PROFILE</Text>
          <Text style={styles.heroTitle}>Profile</Text>
          <Text style={styles.heroName}>{name}</Text>
          {!!user?.email && <Text style={styles.heroEmail}>{user.email}</Text>}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {saveMessage ? (
          <Text style={styles.successText}>
            {saveMessage}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : (
          <View style={styles.formStack}>
            <View style={styles.sectionCard}>
              <SectionHeading>Basic profile</SectionHeading>
              <InputField label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
              <InputField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
              <InputField label="Email" value={email} onChangeText={setEmail} placeholder="Email" />
              <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone" />
            </View>

            <View style={styles.sectionCard}>
              <SectionHeading>Location and language</SectionHeading>
              <InputField label="City" value={city} onChangeText={setCity} placeholder="City" />
              <InputField label="State" value={state} onChangeText={setState} placeholder="State" />
              <InputField label="Country code" value={country} onChangeText={setCountry} placeholder="US" />
              <InputField label="Postal code" value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" />
              <InputField label="Preferred language" value={preferredLanguage} onChangeText={setPreferredLanguage} placeholder="en" />
            </View>
          </View>
        )}

        <View style={styles.actionsWrap}>
          <AppButton title="Save changes" onPress={() => void onSave()} loading={saving} disabled={!hasDirtyFields} />
          <View style={styles.actionsSpacer} />
          <AppButton title="Log out" onPress={() => void signOut()} variant="ghost" />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Text style={styles.sectionHeading}>{children}</Text>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  heroCard: {
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#D4E2FF',
    ...shadows.soft,
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    letterSpacing: 1.6,
    fontWeight: typography.fontWeight.semibold,
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroName: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  heroEmail: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
  },
  successText: {
    marginTop: spacing.sm,
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loadingWrap: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  formStack: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E3E8F3',
    backgroundColor: colors.surfaceElevated,
    gap: spacing.sm,
    ...shadows.soft,
  },
  sectionHeading: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  inputWrap: {
    marginTop: spacing.xs,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBE2EF',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.primary[400],
    backgroundColor: colors.surface,
  },
  actionsWrap: {
    marginTop: spacing['2xl'],
  },
  actionsSpacer: {
    height: spacing.md,
  },
});
