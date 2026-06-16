import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as onboardingApi from '../../api/onboardingApi';
import type { OnboardingMeta } from '../../api/onboardingApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import type { ApiError } from '../../api/types';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import {
  SIGNUP_FLOW_STEPS_USER,
  USER_SELECT_SERVICES_LATER_LABEL,
  USER_SELECT_SERVICES_LATER_VALUE,
  canonicalUserServiceTypeValue,
  userSelectedBabysitterService,
  userSelectedPetSitterService,
} from './onboardingConstants';
import { buildPhoneForApi, type DialOption } from './OnboardingDialPhoneFields';
import { OnboardingPhoneVerificationBlock } from './components/OnboardingPhoneVerificationBlock';
import { OnboardingFlowProgress } from './OnboardingFlowProgress';
import { FilterableSingleSelect, UserServicesTagField, type LabeledOption } from './onboardingPickers';
import {
  MSG_ADDRESS_REQUIRED,
  MSG_PHONE_10_DIGIT,
  OTP_LENGTH_WEB,
  initPhoneFromStored,
  normalizeLocalDigits,
  withOtherCountryOption,
} from './onboardingWebParity';

const MAX_USER_SERVICE_SELECTIONS = 8;
/** Match web `User.vue` Inputs: children max 30, dogs max 50. */
const MAX_CHILDREN_INPUT = 30;
const MAX_DOGS_INPUT = 50;

type Props = {
  meta: OnboardingMeta;
  refreshMeta: (params?: { country?: string }) => Promise<void>;
};

function mapUser(meta: OnboardingMeta): Record<string, string | undefined> {
  const u = meta.user;
  return u && typeof u === 'object' ? (u as Record<string, string | undefined>) : {};
}

export function OnboardingUserScreen({ meta, refreshMeta }: Props) {
  const { refreshMe, confirmSignOut, role } = useAuth();
  const u = mapUser(meta);
  const ed = meta.existingData ?? {};
  const profile = (ed.profile ?? {}) as Record<string, unknown>;
  const loc = (ed.location ?? {}) as Record<string, unknown>;

  /** Match `userServiceTypeOptions` in `User.vue` (already present if value or label matches). */
  const selectLaterInOptions = meta.serviceTypes?.some((o) => {
    const row = o as { value?: string; label?: string };
    return canonicalUserServiceTypeValue(String(row.value ?? ''), row.label) === USER_SELECT_SERVICES_LATER_VALUE;
  });

  const [currentStep, setCurrentStep] = useState(meta.initialStep);
  const [error, setError] = useState<string | null>(null);
  const [servicesLimitError, setServicesLimitError] = useState('');

  const [city, setCity] = useState(u.city || String(loc.city ?? '') || '');
  const [stateVal, setStateVal] = useState(u.state || String(loc.state ?? '') || '');
  const [country, setCountry] = useState((u.country || String(loc.country ?? '') || 'US').toUpperCase());
  const [postalCode, setPostalCode] = useState(
    String(u.postal_code || loc.postal_code || '').trim()
  );
  const [county, setCounty] = useState(String(loc.county ?? '').trim());
  const [locationLabel, setLocationLabel] = useState(String(loc.label ?? '').trim());
  const [preferredLanguage, setPreferredLanguage] = useState(
    (u.preferred_language || 'en').toLowerCase()
  );

  const initialServicesRaw = (
    (((ed.services ?? {}) as Record<string, unknown>).services_needed as string[]) ?? []
  ).filter(Boolean);
  const [servicesNeeded, setServicesNeeded] = useState<string[]>(() => {
    if (initialServicesRaw.length) return initialServicesRaw;
    return [USER_SELECT_SERVICES_LATER_VALUE];
  });

  const [numChildren, setNumChildren] = useState(
    profile.number_of_children != null ? String(profile.number_of_children) : ''
  );
  const [childrenAges, setChildrenAges] = useState(String(profile.children_ages_text ?? ''));
  const [dogsCount, setDogsCount] = useState(
    profile.dogs_count != null ? String(profile.dogs_count) : ''
  );

  const dialOpts = useMemo<DialOption[]>(
    () => (meta.phoneVerification?.phoneDialOptions as DialOption[]) ?? [],
    [meta.phoneVerification?.phoneDialOptions]
  );

  const [countryIsoPhone, setCountryIsoPhone] = useState('US');
  const [phoneLocalDigits, setPhoneLocalDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneInlineError, setPhoneInlineError] = useState<string | null>(null);

  const [submittingAddr, setSubmittingAddr] = useState(false);
  const [sendingPhone, setSendingPhone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    setCurrentStep(meta.initialStep);
  }, [meta.initialStep]);

  const skipInitialCountryRefresh = useRef(false);
  useEffect(() => {
    if (!skipInitialCountryRefresh.current) {
      skipInitialCountryRefresh.current = true;
      return;
    }
    const t = setTimeout(() => {
      void refreshMeta({ country: country.trim() || undefined });
    }, 350);
    return () => clearTimeout(t);
  }, [country, refreshMeta]);

  useEffect(() => {
    const init = initPhoneFromStored(dialOpts, meta.phoneVerification?.phone);
    setCountryIsoPhone(init.countryIso);
    setPhoneLocalDigits(init.phoneLocal);
    setPhoneInlineError(null);
    setOtpSent(String(meta.phoneVerification?.phone || '').replace(/\D/g, '').length >= 10);
    setOtp('');
  }, [dialOpts, meta.phoneVerification?.phone]);

  const countryOptions = useMemo(
    (): LabeledOption[] =>
      withOtherCountryOption((meta.countryOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) }))),
    [meta.countryOptions]
  );
  const stateOptions = useMemo(
    (): LabeledOption[] => (meta.stateOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) })),
    [meta.stateOptions]
  );
  const languageOptions = useMemo(
    (): LabeledOption[] => (meta.languageOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) })),
    [meta.languageOptions]
  );

  const serviceOptions = useMemo(() => {
    const base = meta.serviceTypes ?? [];
    if (selectLaterInOptions) return base;
    return [{ value: USER_SELECT_SERVICES_LATER_VALUE, label: USER_SELECT_SERVICES_LATER_LABEL }, ...base];
  }, [meta.serviceTypes, selectLaterInOptions]);

  const showChildrenFields = useMemo(() => userSelectedBabysitterService(servicesNeeded), [servicesNeeded]);
  const showPetCountField = useMemo(() => userSelectedPetSitterService(servicesNeeded), [servicesNeeded]);

  const pageTitle = useMemo(() => {
    if (currentStep === 3 && meta.requiresPhoneVerification) return 'Phone verification';
    if (currentStep === 4) return 'Congratulations';
    return 'Onboarding';
  }, [currentStep, meta.requiresPhoneVerification]);

  const isUserAddressStep = currentStep === 2;
  const isPhoneStep = meta.requiresPhoneVerification && currentStep === 3;
  const isCongratsStep = currentStep === 4;

  const toggleService = useCallback((value: string, label?: string) => {
    const canonical = canonicalUserServiceTypeValue(value, label);
    setServicesLimitError('');
    if (canonical === USER_SELECT_SERVICES_LATER_VALUE) {
      setServicesNeeded([USER_SELECT_SERVICES_LATER_VALUE]);
      return;
    }
    setServicesNeeded((prev) => {
      let next = prev.filter((v) => v !== USER_SELECT_SERVICES_LATER_VALUE);
      if (next.includes(canonical)) next = next.filter((v) => v !== canonical);
      else next = [...next, canonical];

      // Web: filter falsy + exclude select_later, then slice(0, 8) if over limit.
      const real = [...new Set(next.filter((v) => v && v !== USER_SELECT_SERVICES_LATER_VALUE))];
      if (real.length > MAX_USER_SERVICE_SELECTIONS) {
        setServicesLimitError(`You can select up to ${MAX_USER_SERVICE_SELECTIONS} services.`);
        return real.slice(0, MAX_USER_SERVICE_SELECTIONS);
      }
      setServicesLimitError('');
      if (real.length === 0) return [USER_SELECT_SERVICES_LATER_VALUE];
      return real;
    });
  }, []);

  const onSubmitAddress = async () => {
    setError(null);
    /** Match `submitUserAddressStep` in `User.vue` (client-side only). */
    if (!city.trim() || !stateVal.trim() || !country.trim()) {
      setError(MSG_ADDRESS_REQUIRED);
      return;
    }
    const lang = preferredLanguage.trim().toLowerCase();
    if (!lang) {
      setError('Please select a language preference.');
      return;
    }

    const servicesPayload =
      servicesNeeded.length === 1 && servicesNeeded[0] === USER_SELECT_SERVICES_LATER_VALUE ? [] : servicesNeeded;

    const needBabysitter = userSelectedBabysitterService(servicesNeeded);
    const needPetSitter = userSelectedPetSitterService(servicesNeeded);

    let nc: number | null = null;
    if (needBabysitter && numChildren.trim()) {
      nc = Number(numChildren.trim());
      if (Number.isNaN(nc) || nc < 0 || nc > MAX_CHILDREN_INPUT) {
        setError(`Number of children must be between 0 and ${MAX_CHILDREN_INPUT}.`);
        return;
      }
    }

    let dc: number | null = null;
    if (needPetSitter && dogsCount.trim()) {
      dc = Number(dogsCount.trim());
      if (Number.isNaN(dc) || dc < 0 || dc > MAX_DOGS_INPUT) {
        setError(`Number of pets must be between 0 and ${MAX_DOGS_INPUT}.`);
        return;
      }
    }

    setSubmittingAddr(true);
    /** Payload keys align with `router.post(route('address-detail.send'), …)` in `User.vue`. */
    const res = await onboardingApi.sendOtp({
      address: null,
      city: city.trim(),
      state: stateVal.trim(),
      country: country.trim().toUpperCase(),
      postal_code: postalCode.trim() || undefined,
      county: county.trim() || undefined,
      location_label: locationLabel.trim() || undefined,
      preferred_language: lang || 'en',
      services_needed: servicesPayload,
      number_of_children: needBabysitter ? nc : null,
      children_ages_text: needBabysitter ? childrenAges.trim() || null : null,
      dogs_count: needPetSitter ? dc : null,
    });
    setSubmittingAddr(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res) || 'Please review your details and try again.');
      return;
    }
    if (typeof res.data.nextStep === 'number') setCurrentStep(res.data.nextStep);
    await refreshMeta();
    if (!meta.requiresPhoneVerification) await refreshMe();
  };

  const onSendPhoneOtp = async (): Promise<boolean> => {
    const local = normalizeLocalDigits(phoneLocalDigits);
    setPhoneInlineError(null);
    if (local.length !== 10) {
      setPhoneInlineError(MSG_PHONE_10_DIGIT);
      return false;
    }
    setError(null);
    setSendingPhone(true);
    const res = await onboardingApi.sendOtp({
      phone: buildPhoneForApi(dialOpts, countryIsoPhone, phoneLocalDigits),
    });
    setSendingPhone(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return false;
    }
    setOtpSent(true);
    return true;
  };

  const onVerifyOtp = async () => {
    setError(null);
    setVerifying(true);
    const code = otp.replace(/\D/g, '').slice(0, OTP_LENGTH_WEB);
    const res = await onboardingApi.verifyOtp(code);
    setVerifying(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    if (typeof res.data.nextStep === 'number') setCurrentStep(res.data.nextStep);
    await refreshMe();
    await refreshMeta();
  };

  const onFinish = async () => {
    setError(null);
    const servicesPayload =
      servicesNeeded.length === 1 && servicesNeeded[0] === USER_SELECT_SERVICES_LATER_VALUE ? [] : servicesNeeded;

    const needBabysitter = userSelectedBabysitterService(servicesNeeded);
    const needPetSitter = userSelectedPetSitterService(servicesNeeded);

    const payload = {
      services_needed: servicesPayload,
      city: city.trim(),
      state: stateVal.trim(),
      country: country.trim().toUpperCase(),
      postal_code: postalCode.trim() || undefined,
      county: county.trim() || undefined,
      location_label: locationLabel.trim() || undefined,
      preferred_language: preferredLanguage.trim().toLowerCase() || 'en',
      languages: [preferredLanguage.trim().toLowerCase() || 'en'],
      profile: {
        number_of_children: needBabysitter && numChildren.trim() ? Number(numChildren.trim()) : null,
        children_ages_text: needBabysitter ? childrenAges.trim() || null : null,
        dogs_count: needPetSitter && dogsCount.trim() ? Number(dogsCount.trim()) : null,
      },
    };

    setFinishing(true);
    const res = await onboardingApi.complete(payload);
    setFinishing(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res as ApiError));
      return;
    }
    await refreshMe();
  };

  async function handleBackPress() {
    if (isPhoneStep) {
      if (otpSent) {
        setOtpSent(false);
        setOtp('');
        setPhoneInlineError(null);
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 4) {
      setCurrentStep(meta.requiresPhoneVerification ? 3 : 2);
      return;
    }
    if (currentStep > 2) {
      setCurrentStep(Math.max(2, currentStep - 1));
      return;
    }
    confirmSignOut();
  }

  return (
    <AppScreen style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: spacing['3xl'] }} keyboardShouldPersistTaps="handled">
          {role === 'user' ? (
            <View style={{ marginBottom: spacing.sm, alignSelf: 'flex-start' }}>
              <Pressable
                onPress={() => {
                  void handleBackPress();
                }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
              >
                <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
              </Pressable>
            </View>
          ) : null}

          <OnboardingFlowProgress currentStep={currentStep} totalSteps={SIGNUP_FLOW_STEPS_USER} caption={pageTitle} />

          <Text
            style={{
              marginTop: spacing.lg,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            {pageTitle}
          </Text>
          {error ? (
            <View
              style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: '#FEF2F2',
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: '#FECACA',
              }}
            >
              <Text style={{ color: colors.danger, fontSize: typography.fontSize.sm }}>{error}</Text>
            </View>
          ) : null}

          {isUserAddressStep ? (
            <View style={{ marginTop: spacing.xl }}>
              <UserServicesTagField
                label="Select services needed (up to 8)"
                placeholder="Choose a service to add"
                options={serviceOptions.map((o) => ({ value: String(o.value), label: String(o.label) }))}
                selectedValues={servicesNeeded}
                onToggle={toggleService}
                limitError={servicesLimitError}
                maxSelections={MAX_USER_SERVICE_SELECTIONS}
              />

              <View style={{ height: spacing.sm }} />
              <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <FilterableSingleSelect label="Country" value={country} options={countryOptions} onChange={setCountry} placeholder="Select country" required />
                </View>
                <View style={{ flex: 1, minWidth: 140 }}>
                  {stateOptions.length > 0 ? (
                    <FilterableSingleSelect label="State" value={stateVal} options={stateOptions} onChange={setStateVal} placeholder="Select state" required />
                  ) : (
                    <AppInput label="State / region" value={stateVal} onChangeText={setStateVal} placeholder="Enter state or region" required />
                  )}
                </View>
              </View>
              <AppInput label="City / location" value={city} onChangeText={setCity} placeholder="Enter city or location" required />
              <AppInput
                label="ZIP / postal code"
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder={
                  country.toUpperCase() === 'US'
                    ? 'ZIP or city (required for United States)'
                    : 'Postal or ZIP (if applicable)'
                }
                keyboardType="default"
              />
              <AppInput label="County (optional)" value={county} onChangeText={setCounty} placeholder="County" />
              <AppInput label="Location label (optional)" value={locationLabel} onChangeText={setLocationLabel} />

              <FilterableSingleSelect
                label="Language preference"
                value={preferredLanguage}
                options={languageOptions}
                onChange={(v: string) => setPreferredLanguage(v.toLowerCase())}
                placeholder="Select language"
                required
              />

              {showChildrenFields ? (
                <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <AppInput
                      label="Number of children"
                      value={numChildren}
                      onChangeText={setNumChildren}
                      keyboardType="numeric"
                      placeholder="e.g. 2"
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <AppInput label="Children's ages" value={childrenAges} onChangeText={setChildrenAges} placeholder="e.g. 4, 7 or newborn" />
                  </View>
                </View>
              ) : null}
              {showPetCountField ? (
                <AppInput
                  label="Number of pets"
                  value={dogsCount}
                  onChangeText={setDogsCount}
                  keyboardType="numeric"
                  placeholder="How many pets in the household?"
                />
              ) : null}

              <View style={{ height: spacing.lg }} />
              <AppButton title="Continue" onPress={() => void onSubmitAddress()} loading={submittingAddr} />
            </View>
          ) : null}

          {isPhoneStep ? (
            <View style={{ marginTop: spacing.xl }}>
              <OnboardingPhoneVerificationBlock
                phoneDialOptions={dialOpts}
                countryIso={countryIsoPhone}
                onCountryIsoChange={setCountryIsoPhone}
                phoneLocalDigits={phoneLocalDigits}
                onPhoneLocalChange={(digits) => {
                  setPhoneLocalDigits(digits);
                  if (phoneInlineError) setPhoneInlineError(null);
                }}
                otpSent={otpSent}
                otpCode={otp}
                onOtpCodeChange={setOtp}
                onResendPress={() => onSendPhoneOtp()}
                resendBusy={sendingPhone}
                fieldError={phoneInlineError}
              />
              <AppButton
                title={otpSent ? 'Verify & Continue' : 'Send code'}
                onPress={() => {
                  if (otpSent) {
                    void onVerifyOtp();
                    return;
                  }
                  void onSendPhoneOtp();
                }}
                loading={otpSent ? verifying : sendingPhone}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : null}

          {isCongratsStep ? (
            <View
              style={{
                marginTop: spacing.xl,
                padding: spacing.lg,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: '#A7F3D0',
                backgroundColor: '#ECFDF5',
              }}
            >
              <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#065F46' }}>
                Congratulations!
              </Text>
              <Text style={{ marginTop: spacing.sm, color: '#065F46', fontSize: typography.fontSize.sm, lineHeight: 20 }}>
                You are all set to finish onboarding when you tap the button below.
              </Text>
              <View style={{ height: spacing.lg }} />
              <AppButton title="Finish setup" onPress={() => void onFinish()} loading={finishing} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
