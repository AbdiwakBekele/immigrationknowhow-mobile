import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { BrandWordmark } from '../../components/BrandWordmark';
import { colors } from '../../theme/colors';
import { radii, screenPaddingX } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../api/authApi';
import type { RegisterPayload } from '../../api/authApi';
import { PicklistField } from '../onboarding/components/PicklistField';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { IonIconName } from '../../navigation/tabBar';

type RoleOption = { value: 'user' | 'provider' | 'advertiser'; label: string; description: string; icon: IonIconName };

const ROLES: RoleOption[] = [
  {
    value: 'user',
    label: 'Service seeker',
    description: 'Find trusted providers',
    icon: 'person-outline',
  },
  {
    value: 'provider',
    label: 'Service provider',
    description: 'Offer services & manage leads',
    icon: 'briefcase-outline',
  },
  {
    value: 'advertiser',
    label: 'Advertiser',
    description: 'Run sponsored ads & campaigns',
    icon: 'megaphone-outline',
  },
];

export function SignUpScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [role, setRole] = useState<RoleOption['value']>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [providerServiceOptions, setProviderServiceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await authApi.registerMeta();
      setMetaLoading(false);
      if (res.success) {
        setProviderServiceOptions(
          res.data.service_types_provider.map((o) => ({ value: o.value, label: o.label })),
        );
      }
    })();
  }, []);

  const payload: RegisterPayload = useMemo(
    () => ({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      password_confirmation: passwordConfirmation,
      role,
      service_type: role === 'provider' ? (serviceType.trim() || null) : null,
    }),
    [firstName, lastName, email, password, passwordConfirmation, role, serviceType]
  );

  async function onSubmit() {
    setError(null);

    if (!payload.first_name || !payload.last_name || !payload.email) {
      setError('Please fill in your name and email.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'provider' && !payload.service_type) {
      setError('Please choose the service you provide.');
      return;
    }
    if (role === 'provider' && !metaLoading && providerServiceOptions.length === 0) {
      setError('Service types could not be loaded. Try again in a moment.');
      return;
    }

    setLoading(true);
    const res = await signUp(payload);
    setLoading(false);
    if (!res.ok) setError(res.message);
  }

  return (
    <AppScreen variant="muted">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {navigation.canGoBack() ? (
            <View style={styles.backRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                style={styles.backHit}
              >
                <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.header}>
            <BrandWordmark width={248} />
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>{"Choose how you'll use ImmigrationKnowHow."}</Text>
          </View>

          <View style={styles.roleList}>
            <Text style={styles.roleSectionLabel}>Account type</Text>
            {ROLES.map((r) => {
              const active = r.value === role;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => {
                    setRole(r.value);
                    if (r.value !== 'provider') {
                      setServiceType('');
                    }
                    setError(null);
                  }}
                  style={[styles.roleCard, active ? styles.roleCardActive : null]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.roleIconWrap, active ? styles.roleIconWrapActive : null]}>
                    <Ionicons name={r.icon} size={22} color={active ? colors.primary[700] : colors.text.muted} />
                  </View>
                  <Text style={[styles.roleLabel, active ? styles.roleLabelActive : null]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            {role === 'provider' ? (
              metaLoading ? (
                <Text style={styles.metaLoading}>Loading service options…</Text>
              ) : providerServiceOptions.length > 0 ? (
                <PicklistField
                  label="Service you provide"
                  value={serviceType}
                  options={providerServiceOptions}
                  onChange={(v) => {
                    setServiceType(v);
                    setError(null);
                  }}
                  placeholder="Choose the service you provide"
                  required
                />
              ) : (
                <Text style={styles.metaError}>Could not load service types. Check your connection and try again.</Text>
              )
            ) : null}

            <AppInput
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              autoCapitalize="words"
              leftIcon="person-outline"
            />
            <AppInput
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              autoCapitalize="words"
              leftIcon="person-outline"
            />
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
            <AppInput
              label="Confirm password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="Repeat password"
              secureTextEntry
              leftIcon="shield-checkmark-outline"
            />

            {!!error && (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: spacing.sm }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <AppButton
              title="Create account"
              onPress={onSubmit}
              loading={loading}
              disabled={
                loading ||
                (role === 'provider' && (metaLoading || providerServiceOptions.length === 0))
              }
            />
          </View>

          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footerLink} hitSlop={12}>
            <Ionicons name="log-in-outline" size={18} color={colors.primary[600]} style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerBold}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: screenPaddingX,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  backRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  backHit: {
    paddingVertical: 4,
    paddingRight: 2,
    marginLeft: -spacing.xs,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  roleList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  roleSectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  roleCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleIconWrapActive: {
    backgroundColor: colors.primary[100],
  },
  roleLabel: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  roleLabelActive: {
    color: colors.primary[800],
  },
  roleDesc: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.softLg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footerLink: {
    marginTop: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  footerBold: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  metaLoading: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  metaError: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
