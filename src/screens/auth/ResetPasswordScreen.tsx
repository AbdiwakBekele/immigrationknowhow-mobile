import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as authApi from '../../api/authApi';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const initialEmail = route.params?.email ?? '';
  const initialToken = route.params?.token ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !token.trim() || !password || !passwordConfirmation) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await authApi.resetPassword({
      email: email.trim(),
      token: token.trim(),
      password,
      password_confirmation: passwordConfirmation,
    });
    setLoading(false);
    if (!res.success) {
      const fieldError =
        res.errors && typeof res.errors === 'object' && 'email' in res.errors
          ? (res.errors as { email?: string[] }).email?.[0]
          : undefined;
      setError(fieldError ?? res.message);
      return;
    }
    setDone(true);
  }

  return (
    <AppScreen variant="muted" constrained>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.backRow} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.primary[700]} />
            <Text style={styles.backText}>Back to sign in</Text>
          </Pressable>

          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Paste the reset token from your email link, or open the link in your browser. The token is
            the long value in the reset URL.
          </Text>

          {done ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Your password was updated. You can sign in now.</Text>
              <AppButton title="Sign in" onPress={() => navigation.navigate('SignIn')} />
            </View>
          ) : (
            <View style={styles.card}>
              <AppInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
              <AppInput
                label="Reset token"
                value={token}
                onChangeText={setToken}
                placeholder="From your reset email link"
                autoCapitalize="none"
                leftIcon="key-outline"
              />
              <AppInput
                label="New password"
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
              <AppInput
                label="Confirm password"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Confirm new password"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              {!!error && (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: spacing.sm }} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              <AppButton title="Reset password" onPress={onSubmit} loading={loading} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.softLg,
  },
  successBanner: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing.lg,
  },
  successText: {
    color: colors.primary[900],
    fontSize: typography.fontSize.md,
    lineHeight: 22,
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
});
