import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import * as onboardingApi from '../../api/onboardingApi';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

export function OnboardingHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<onboardingApi.OnboardingMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await onboardingApi.meta();
      setLoading(false);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setMeta(res.data);
      setPhone(res.data.phoneVerification?.phone ?? '');
    })();
  }, []);

  async function onSendOtp() {
    if (!phone.trim()) return;
    setError(null);
    const res = await onboardingApi.sendOtp({ phone: phone.trim() });
    if (!res.success) {
      setError(res.message);
      return;
    }
    setOtpSent(true);
  }

  async function onVerifyOtp() {
    setError(null);
    const res = await onboardingApi.verifyOtp(otp.trim());
    if (!res.success) {
      setError(res.message);
      return;
    }
    await refreshMe();
    // Next: we’ll implement the full multi-step onboarding UI.
  }

  if (loading) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      {navigation.canGoBack() ? (
        <View style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={{ paddingVertical: 4, marginLeft: -spacing.xs }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </Pressable>
        </View>
      ) : null}
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
        Complete onboarding
      </Text>
      <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
        This mirrors the Laravel onboarding gates (phone verification + onboarding steps).
      </Text>

      {!!error && <Text style={{ marginTop: spacing.md, color: colors.danger }}>{error}</Text>}

      {meta?.requiresPhoneVerification ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.sm }}>
            Phone verification
          </Text>

          <AppInput label="Phone" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />

          {!otpSent ? (
            <AppButton title="Send code" onPress={onSendOtp} />
          ) : (
            <>
              <AppInput label="OTP code" value={otp} onChangeText={setOtp} placeholder="6-digit code" keyboardType="numeric" />
              <AppButton title="Verify code" onPress={onVerifyOtp} />
            </>
          )}
        </View>
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ color: colors.text.secondary }}>
            Phone is verified. Next we’ll render the actual provider/seeker onboarding steps from Laravel.
          </Text>
        </View>
      )}
    </AppScreen>
  );
}

