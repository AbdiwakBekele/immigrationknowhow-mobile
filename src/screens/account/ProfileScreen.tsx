import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { ProviderProfileScreen } from './ProviderProfileScreen';
import { typography } from '../../theme/typography';
import * as profileApi from '../../api/profileApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import { shadows } from '../../theme/shadows';

export function ProfileScreen() {
  const { user, role, signOut, refreshMe } = useAuth();
  const [profileUser, setProfileUser] = useState<profileApi.MobileProfileData['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
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

  const hydrateForm = useCallback((nextUser: profileApi.MobileProfileData['user'] | null | undefined) => {
    setFirstName((nextUser?.first_name ?? '').trim());
    setLastName((nextUser?.last_name ?? '').trim());
    setEmail((nextUser?.email ?? '').trim());
    setPhone((nextUser?.phone ?? '').trim());
    setCity((nextUser?.city ?? '').trim());
    setState((nextUser?.state ?? '').trim());
    setCountry((nextUser?.country ?? '').trim());
    setPostalCode((nextUser?.postal_code ?? '').trim());
    setPreferredLanguage((String(nextUser?.preferred_language ?? '').trim() || 'en').toLowerCase());
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await profileApi.getProfile();
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setProfileUser(res.data.user);
    hydrateForm(res.data.user);
  }, [hydrateForm]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const displayUser = profileUser ?? user;
  const name = [displayUser?.first_name, displayUser?.last_name].filter(Boolean).join(' ').trim() || 'Profile';
  const initials = useMemo(() => {
    const parts = [displayUser?.first_name, displayUser?.last_name]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);
    if (!parts.length) return 'P';
    return parts.slice(0, 2).map((value) => value[0]?.toUpperCase() ?? '').join('') || 'P';
  }, [displayUser?.first_name, displayUser?.last_name]);
  const hasDirtyFields = useMemo(
    () =>
      firstName.trim() !== (profileUser?.first_name ?? '').trim() ||
      lastName.trim() !== (profileUser?.last_name ?? '').trim() ||
      email.trim() !== (profileUser?.email ?? '').trim() ||
      phone.trim() !== (profileUser?.phone ?? '').trim() ||
      city.trim() !== (profileUser?.city ?? '').trim() ||
      state.trim() !== (profileUser?.state ?? '').trim() ||
      country.trim() !== (profileUser?.country ?? '').trim() ||
      preferredLanguage.trim() !== String(profileUser?.preferred_language ?? '').trim().toLowerCase() ||
      postalCode.trim() !== String(profileUser?.postal_code ?? '').trim(),
    [profileUser, firstName, lastName, email, phone, city, state, country, preferredLanguage, postalCode]
  );

  const onSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim().toUpperCase() || null,
      postal_code: postalCode.trim() || null,
      preferred_language: preferredLanguage.trim().toLowerCase() || 'en',
    };
    const res = await profileApi.updateProfile(payload);
    setSaving(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setProfileUser(res.data.user);
    hydrateForm(res.data.user);
    setSaveMessage('Saved');
    await refreshMe();
  };

  const onPickAvatar = async () => {
    setAvatarBusy(true);
    setSaveMessage(null);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) {
        setAvatarBusy(false);
        return;
      }

      const asset = result.assets[0];
      const res = await profileApi.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName?.trim() || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType?.trim() || 'image/jpeg',
        file: (asset as { file?: Blob }).file,
      });
      setAvatarBusy(false);
      if (!res.success) {
        setError(friendlyApiErrorMessage(res));
        return;
      }
      setProfileUser(res.data.user);
      setSaveMessage('Profile photo updated');
      await refreshMe();
    } catch (err) {
      setAvatarBusy(false);
      const message = err instanceof Error ? err.message : 'Unable to pick a photo right now.';
      setError(message);
    }
  };

  const onRemoveAvatar = async () => {
    setAvatarBusy(true);
    setSaveMessage(null);
    setError(null);
    const res = await profileApi.deleteAvatar();
    setAvatarBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setProfileUser(res.data.user);
    setSaveMessage('Profile photo removed');
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
          <View style={styles.heroTopRow}>
            {displayUser?.avatar_url ? (
              <Image source={{ uri: displayUser.avatar_url }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>PROFILE</Text>
              <Text style={styles.heroTitle}>Profile</Text>
              <Text style={styles.heroName}>{name}</Text>
              {!!displayUser?.email && <Text style={styles.heroEmail}>{displayUser.email}</Text>}
            </View>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={[styles.avatarAction, avatarBusy && styles.avatarActionDisabled]} onPress={() => void onPickAvatar()} disabled={avatarBusy}>
              <Text style={styles.avatarActionText}>{displayUser?.avatar_url ? 'Change photo' : 'Upload photo'}</Text>
            </Pressable>
            {displayUser?.avatar_url ? (
              <Pressable
                style={[styles.avatarGhostAction, avatarBusy && styles.avatarActionDisabled]}
                onPress={() => void onRemoveAvatar()}
                disabled={avatarBusy}
              >
                <Text style={styles.avatarGhostActionText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
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
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  avatarInitials: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  heroActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarAction: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[600],
  },
  avatarGhostAction: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D4E2FF',
  },
  avatarActionDisabled: {
    opacity: 0.6,
  },
  avatarActionText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  avatarGhostActionText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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
