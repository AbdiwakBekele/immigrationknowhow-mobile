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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { BrandWordmark } from '../../components/BrandWordmark';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { useAuth } from '../../context/AuthContext';
import { useContinueAsGuest } from '../../hooks/useContinueAsGuest';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function SignInScreen() {
  const { signIn } = useAuth();
  const continueAsGuest = useContinueAsGuest();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (!res.ok) setError(res.message);
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
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.header}>
            <BrandWordmark width={248} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account.</Text>
          </View>

          <View style={styles.card}>
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
              placeholder="Enter your password"
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            {!!error && (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: spacing.sm }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <AppButton title="Sign In" onPress={onSubmit} loading={loading} />

            <Pressable onPress={() => void continueAsGuest()} style={styles.guestLink} hitSlop={12}>
              <Text style={styles.guestText}>Continue as Guest</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.footerLink} hitSlop={12}>
            <Text style={styles.footerText}>
              {"Don't have an account? "}
              <Text style={styles.footerBold}>Sign up</Text>
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary[600]} style={{ marginLeft: 4 }} />
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
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing['2xl'],
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
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
  guestLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  guestText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
});
