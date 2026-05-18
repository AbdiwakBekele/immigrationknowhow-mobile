import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { OnboardingMeta } from '../../api/onboardingApi';
import { OnboardingPhoneVerificationBlock } from './components/OnboardingPhoneVerificationBlock';
import { OnboardingSectionCard } from './components/OnboardingSectionCard';
import { FilterableSingleSelect, UserServicesTagField, type LabeledOption } from './onboardingPickers';
import {
  USER_SELECT_SERVICES_LATER_LABEL,
  USER_SELECT_SERVICES_LATER_VALUE,
  canonicalUserServiceTypeValue,
  userSelectedBabysitterService,
  userSelectedPetSitterService,
} from './onboardingConstants';

const MAX_SERVICES = 8;

export type SeekerOnboardingContentProps = {
  step: number;
  meta: OnboardingMeta;
  needsPhone: boolean;
  seekerServices: string[];
  onToggleService: (value: string, label: string) => void;
  seekerCountry: string;
  onSeekerCountryChange: (v: string) => void;
  seekerState: string;
  onSeekerStateChange: (v: string) => void;
  seekerCity: string;
  onSeekerCityChange: (v: string) => void;
  seekerPostal: string;
  onSeekerPostalChange: (v: string) => void;
  seekerCounty: string;
  onSeekerCountyChange: (v: string) => void;
  seekerLocationLabel: string;
  onSeekerLocationLabelChange: (v: string) => void;
  seekerLanguage: string;
  onSeekerLanguageChange: (v: string) => void;
  seekerChildrenCount: string;
  onSeekerChildrenCountChange: (v: string) => void;
  seekerChildrenAges: string;
  onSeekerChildrenAgesChange: (v: string) => void;
  seekerDogs: string;
  onSeekerDogsChange: (v: string) => void;
  dialCountry: string;
  onDialCountryChange: (iso: string) => void;
  phoneLocal: string;
  onPhoneLocalChange: (digits: string) => void;
  otp: string;
  onOtpChange: (code: string) => void;
  otpSent: boolean;
  onResendPhone: () => Promise<boolean>;
  resendBusy: boolean;
  phoneFieldError: string | null;
  phoneDialOptions: Array<{ value: string; label: string; dial: string }>;
};

export function SeekerOnboardingContent(props: SeekerOnboardingContentProps) {
  const {
    step,
    meta,
    needsPhone,
    seekerServices,
    onToggleService,
    seekerCountry,
    onSeekerCountryChange,
    seekerState,
    onSeekerStateChange,
    seekerCity,
    onSeekerCityChange,
    seekerPostal,
    onSeekerPostalChange,
    seekerCounty,
    onSeekerCountyChange,
    seekerLocationLabel,
    onSeekerLocationLabelChange,
    seekerLanguage,
    onSeekerLanguageChange,
    seekerChildrenCount,
    onSeekerChildrenCountChange,
    seekerChildrenAges,
    onSeekerChildrenAgesChange,
    seekerDogs,
    onSeekerDogsChange,
    dialCountry,
    onDialCountryChange,
    phoneLocal,
    onPhoneLocalChange,
    otp,
    onOtpChange,
    otpSent,
    onResendPhone,
    resendBusy,
    phoneFieldError,
    phoneDialOptions,
  } = props;

  const [servicesLimitError, setServicesLimitError] = useState('');

  const serviceOptions = useMemo(() => {
    const base = (meta.serviceTypes ?? []).map((o) => ({
      value: String(o.value),
      label: String(o.label),
    }));
    const hasLater = base.some(
      (o) => canonicalUserServiceTypeValue(o.value, o.label) === USER_SELECT_SERVICES_LATER_VALUE,
    );
    return hasLater ? base : [{ value: USER_SELECT_SERVICES_LATER_VALUE, label: USER_SELECT_SERVICES_LATER_LABEL }, ...base];
  }, [meta.serviceTypes]);

  const countryOptions = useMemo(
    (): LabeledOption[] => (meta.countryOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) })),
    [meta.countryOptions],
  );
  const stateOptions = useMemo(
    (): LabeledOption[] => (meta.stateOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) })),
    [meta.stateOptions],
  );
  const languageOptions = useMemo(
    (): LabeledOption[] => (meta.languageOptions ?? []).map((o) => ({ value: String(o.value), label: String(o.label) })),
    [meta.languageOptions],
  );

  const showChildren = userSelectedBabysitterService(seekerServices);
  const showPets = userSelectedPetSitterService(seekerServices);
  const stateUsePicklist = stateOptions.length > 0;
  const isUs = seekerCountry.toUpperCase() === 'US';

  const handleToggleService = (value: string, label: string) => {
    const canonical = canonicalUserServiceTypeValue(value, label);
    if (canonical === USER_SELECT_SERVICES_LATER_VALUE) {
      setServicesLimitError('');
      onToggleService(value, label);
      return;
    }
    const real = seekerServices.filter((v) => v !== USER_SELECT_SERVICES_LATER_VALUE);
    if (!seekerServices.includes(canonical) && real.length >= MAX_SERVICES) {
      setServicesLimitError(`You can select up to ${MAX_SERVICES} services.`);
      return;
    }
    setServicesLimitError('');
    onToggleService(value, label);
  };

  if (step === 2) {
    return (
      <View style={styles.stack}>
        <OnboardingSectionCard
          title="What do you need?"
          subtitle="Select up to 8 services, or choose to decide later."
        >
          <UserServicesTagField
            label="Select services needed (up to 8)"
            placeholder="Choose a service to add"
            options={serviceOptions}
            selectedValues={seekerServices}
            onToggle={handleToggleService}
            limitError={servicesLimitError}
            maxSelections={MAX_SERVICES}
          />
        </OnboardingSectionCard>

        <OnboardingSectionCard
          title="Your location"
          subtitle="We use this to match you with providers in your area."
        >
          <FilterableSingleSelect
            label="Country"
            value={seekerCountry}
            options={countryOptions}
            onChange={onSeekerCountryChange}
            placeholder="Select country"
            required
          />
          {stateUsePicklist ? (
            <FilterableSingleSelect
              label="State"
              value={seekerState}
              options={stateOptions}
              onChange={onSeekerStateChange}
              placeholder="Select state"
              required
            />
          ) : (
            <AppInput label="State / region" value={seekerState} onChangeText={onSeekerStateChange} placeholder="Required" required />
          )}
          <AppInput label="City" value={seekerCity} onChangeText={onSeekerCityChange} placeholder="City" required />
          <AppInput
            label={isUs ? 'ZIP code' : 'ZIP / postal code'}
            value={seekerPostal}
            onChangeText={onSeekerPostalChange}
            placeholder={isUs ? 'Required for United States' : 'Postal code'}
            required={isUs}
          />
          <AppInput label="County (optional)" value={seekerCounty} onChangeText={onSeekerCountyChange} />
          <AppInput label="Location label (optional)" value={seekerLocationLabel} onChangeText={onSeekerLocationLabelChange} />
        </OnboardingSectionCard>

        <OnboardingSectionCard title="Preferences">
          <FilterableSingleSelect
            label="Language preference"
            value={seekerLanguage}
            options={languageOptions}
            onChange={onSeekerLanguageChange}
            placeholder="Select language"
            required
          />
        </OnboardingSectionCard>

        {(showChildren || showPets) && (
          <OnboardingSectionCard title="Household details" subtitle="Helps providers prepare for your visit.">
            {showChildren ? (
              <View style={styles.row2}>
                <View style={styles.half}>
                  <AppInput
                    label="Number of children"
                    value={seekerChildrenCount}
                    onChangeText={onSeekerChildrenCountChange}
                    keyboardType="numeric"
                    placeholder="e.g. 2"
                  />
                </View>
                <View style={styles.half}>
                  <AppInput
                    label="Children's ages"
                    value={seekerChildrenAges}
                    onChangeText={onSeekerChildrenAgesChange}
                    placeholder="e.g. 4, 7"
                  />
                </View>
              </View>
            ) : null}
            {showPets ? (
              <AppInput
                label="Number of pets"
                value={seekerDogs}
                onChangeText={onSeekerDogsChange}
                keyboardType="numeric"
                placeholder="How many pets in the household?"
              />
            ) : null}
          </OnboardingSectionCard>
        )}
      </View>
    );
  }

  if (step === 3 && needsPhone) {
    return (
      <OnboardingSectionCard title="Verify your phone" subtitle="We'll send a one-time code to confirm your number.">
        <OnboardingPhoneVerificationBlock
          phoneDialOptions={phoneDialOptions}
          countryIso={dialCountry}
          onCountryIsoChange={onDialCountryChange}
          phoneLocalDigits={phoneLocal}
          onPhoneLocalChange={onPhoneLocalChange}
          otpSent={otpSent}
          otpCode={otp}
          onOtpCodeChange={onOtpChange}
          onResendPress={onResendPhone}
          resendBusy={resendBusy}
          fieldError={phoneFieldError}
        />
      </OnboardingSectionCard>
    );
  }

  if (step === 4) {
    return (
      <View style={styles.congratsWrap}>
        <View style={styles.congratsIcon}>
          <Ionicons name="checkmark-circle" size={48} color="#059669" />
        </View>
        <Text style={styles.congratsTitle}>Congratulations!</Text>
        <Text style={styles.congratsBody}>
          You&apos;re all set to finish onboarding. Tap &quot;Finish setup&quot; below when you&apos;re ready to enter the app.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  half: {
    flex: 1,
    minWidth: 140,
  },
  congratsWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  congratsIcon: {
    marginBottom: spacing.md,
  },
  congratsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#065F46',
    textAlign: 'center',
  },
  congratsBody: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
