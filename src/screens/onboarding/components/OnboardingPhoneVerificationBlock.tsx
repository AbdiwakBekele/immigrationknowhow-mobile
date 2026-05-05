import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PhoneDialOption } from '../../../api/onboardingApi';
import { colors } from '../../../theme/colors';
import { radii } from '../../../theme/layout';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

const OTP_LENGTH = 6;

function flagEmoji(iso2: string): string {
  const s = String(iso2 || '').toUpperCase();
  if (s.length !== 2 || /[^A-Z]/.test(s)) return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + s.charCodeAt(0) - 65, A + s.charCodeAt(1) - 65);
}

const formatUsPhone = (digits: string) => {
  const clean = String(digits || '')
    .replace(/\D/g, '')
    .slice(0, 10);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
};

type Props = {
  phoneDialOptions: PhoneDialOption[];
  /** ISO2 for dial listbox, e.g. US */
  countryIso: string;
  onCountryIsoChange: (iso: string) => void;
  phoneLocalDigits: string;
  onPhoneLocalChange: (digits: string) => void;
  otpSent: boolean;
  otpCode: string;
  onOtpCodeChange: (code: string) => void;
  onResendPress: () => void;
  resendBusy?: boolean;
  /** Shown under phone row (API / validation). */
  fieldError?: string | null;
};

/**
 * Mirrors web `OnboardingPhoneVerification.vue` layout (single phone row + 6 OTP inputs + resend),
 * excluding footer Back/Continue (parent uses external actions).
 */
export function OnboardingPhoneVerificationBlock({
  phoneDialOptions,
  countryIso,
  onCountryIsoChange,
  phoneLocalDigits,
  onPhoneLocalChange,
  otpSent,
  otpCode,
  onOtpCodeChange,
  resendBusy,
  onResendPress,
  fieldError,
}: Props) {
  const otpInputsRef = useRef<Array<TextInput | null>>([]);
  const [dialOpen, setDialOpen] = useState(false);
  const [dialQuery, setDialQuery] = useState('');

  const selectedDial = useMemo(() => {
    const o = phoneDialOptions.find((x) => x.value === countryIso);
    return o ? String(o.dial) : '1';
  }, [phoneDialOptions, countryIso]);

  const isNanp = useMemo(() => {
    const u = countryIso.toUpperCase();
    return u === 'US' || u === 'CA';
  }, [countryIso]);

  const nationalMaxDigits = isNanp ? 10 : 14;

  const phoneLocalDisplay = useMemo(() => {
    const clean = String(phoneLocalDigits || '')
      .replace(/\D/g, '')
      .slice(0, nationalMaxDigits);
    if (isNanp) return formatUsPhone(clean);
    return clean;
  }, [phoneLocalDigits, isNanp, nationalMaxDigits]);

  const filteredDialOptions = useMemo(() => {
    const q = dialQuery
      .trim()
      .toLowerCase()
      .replace(/^\++/, '');
    if (!q) return phoneDialOptions;
    return phoneDialOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        String(o.dial).includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [phoneDialOptions, dialQuery]);

  useEffect(() => {
    if (!dialOpen) setDialQuery('');
  }, [dialOpen]);

  const otpDigits = useMemo(() => {
    const digits = otpCode.replace(/\D/g, '').slice(0, OTP_LENGTH);
    return Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || '');
  }, [otpCode]);

  const setOtpFromDigitsArray = useCallback(
    (chars: string[]) => {
      onOtpCodeChange(chars.join('').replace(/\D/g, '').slice(0, OTP_LENGTH));
    },
    [onOtpCodeChange],
  );

  const focusOtp = useCallback((index: number) => {
    const i = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    requestAnimationFrame(() => {
      otpInputsRef.current[i]?.focus();
    });
  }, []);

  useEffect(() => {
    if (otpSent) {
      focusOtp(0);
    }
  }, [otpSent, focusOtp]);

  const handleOtpChange = (index: number, text: string) => {
    const typed = String(text || '').replace(/\D/g, '');
    const next = [...otpDigits];

    if (!typed) {
      next[index] = '';
      setOtpFromDigitsArray(next);
      return;
    }

    typed
      .slice(0, OTP_LENGTH - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    setOtpFromDigitsArray(next);
    const nextIndex = Math.min(index + typed.length, OTP_LENGTH - 1);
    focusOtp(nextIndex);
  };

  const handleOtpKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = e.nativeEvent.key;
    if (key !== 'Backspace') return;

    const next = [...otpDigits];
    if (next[index]) {
      next[index] = '';
      setOtpFromDigitsArray(next);
      return;
    }
    if (index > 0) {
      next[index - 1] = '';
      setOtpFromDigitsArray(next);
      focusOtp(index - 1);
    }
  };

  if (!otpSent) {
    return (
      <View style={styles.block}>
        <View
          style={[styles.phoneShell, !!fieldError && styles.phoneShellError]}
          accessibilityLabel="Phone number"
        >
          <View style={styles.dialSlot}>
            <Pressable
              onPress={() => setDialOpen(true)}
              style={({ pressed }) => [styles.dialButton, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Country calling code"
            >
              <Text style={styles.dialFlag}>{flagEmoji(countryIso)}</Text>
              <Text style={styles.dialPlus} numberOfLines={1}>
                +{selectedDial}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#a3a3a3" />
            </Pressable>
            <Modal visible={dialOpen} transparent animationType="slide" onRequestClose={() => setDialOpen(false)}>
              <Pressable style={styles.modalBackdrop} onPress={() => setDialOpen(false)}>
                <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>Country / region</Text>
                  <TextInput
                    value={dialQuery}
                    onChangeText={setDialQuery}
                    placeholder="Search country or calling code"
                    placeholderTextColor={colors.text.muted}
                    autoCorrect={false}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                    style={styles.modalSearch}
                  />
                  <FlatList
                    data={filteredDialOptions}
                    keyExtractor={(item) => item.value}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={20}
                    maxToRenderPerBatch={24}
                    windowSize={10}
                    ListEmptyComponent={
                      <Text style={styles.modalEmpty}>No countries match your search.</Text>
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        style={({ pressed }) => [styles.modalOption, pressed && { backgroundColor: colors.primary[50] }]}
                        onPress={() => {
                          onCountryIsoChange(item.value);
                          setDialOpen(false);
                        }}
                      >
                        <Text style={styles.modalOptionFlag}>{flagEmoji(item.value)}</Text>
                        <Text style={styles.modalOptionDial}>+{item.dial}</Text>
                        <Text style={styles.modalOptionLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                        {item.value === countryIso ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} />
                        ) : null}
                      </Pressable>
                    )}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          </View>
          <TextInput
            value={phoneLocalDisplay}
            onChangeText={(t) =>
              onPhoneLocalChange(
                String(t || '')
                  .replace(/\D/g, '')
                  .slice(0, nationalMaxDigits),
              )
            }
            placeholder={isNanp ? '123-456-7890' : 'Mobile number'}
            placeholderTextColor={colors.text.muted}
            keyboardType="phone-pad"
            maxLength={isNanp ? 12 : 14}
            style={styles.phoneInput}
          />
        </View>
        {!!fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <View style={styles.otpRow} accessibilityLabel="6-digit verification code">
        {otpDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(r) => {
              otpInputsRef.current[index] = r;
            }}
            value={digit}
            onChangeText={(t) => handleOtpChange(index, t)}
            onKeyPress={(e) => handleOtpKeyPress(index, e)}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.otpCell, !!fieldError && styles.otpCellError]}
            textAlign="center"
            textAlignVertical="center"
            selectTextOnFocus
          />
        ))}
      </View>
      {!!fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}

      <View style={styles.resendWrap}>
        <Pressable onPress={onResendPress} disabled={resendBusy} accessibilityRole="button">
          <Text style={[styles.resendText, resendBusy && styles.resendDisabled]}>Resend code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
  },
  phoneShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    minHeight: 58,
  },
  phoneShellError: {
    borderColor: '#fca5a5',
  },
  dialSlot: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    width: 108,
    maxWidth: 124,
    flexShrink: 0,
    flexGrow: 0,
    justifyContent: 'center',
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    backgroundColor: 'transparent',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'nowrap',
  },
  otpCell: {
    width: 44,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#d4d4d4',
    backgroundColor: colors.surfaceElevated,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  otpCellError: {
    borderColor: '#fca5a5',
  },
  fieldError: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },
  resendWrap: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  resendDisabled: {
    opacity: 0.5,
  },
  dialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    minHeight: 56,
    flex: 1,
  },
  dialFlag: { fontSize: 15 },
  dialPlus: {
    flexShrink: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '72%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  modalSearch: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  modalEmpty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalOptionFlag: { fontSize: 18 },
  modalOptionDial: { fontWeight: typography.fontWeight.semibold, color: colors.text.primary, width: 48 },
  modalOptionLabel: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.secondary },
});
