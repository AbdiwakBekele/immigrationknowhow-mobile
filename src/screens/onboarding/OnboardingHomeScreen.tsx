import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../types/user';
import * as onboardingApi from '../../api/onboardingApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { AuthFlowProgressBar } from './components/AuthFlowProgressBar';
import { OnboardingPhoneVerificationBlock } from './components/OnboardingPhoneVerificationBlock';
import { PicklistField } from './components/PicklistField';
import {
  PRICING_MODELS,
  PROVIDER_COVERAGE_COUNTRIES,
  PROVIDER_COVERAGE_USES_STATE_LIST,
  SIGNUP_FLOW_STEPS_PROVIDER,
  SIGNUP_FLOW_STEPS_USER,
  TUTOR_DELIVERY_METHOD_OPTIONS,
  TUTOR_SERVICE_VALUES,
} from './constants';
import {
  USER_SELECT_SERVICES_LATER_VALUE,
  canonicalUserServiceTypeValue,
  userSelectedBabysitterService,
  userSelectedPetSitterService,
} from './onboardingConstants';
import { SeekerOnboardingContent } from './SeekerOnboardingContent';

const MAX_USER_SERVICES = 8;

function SectionLabel({ children, flushTop }: { children: string; flushTop?: boolean }) {
  return (
    <View style={[styles.sectionLabelWrap, flushTop ? styles.sectionLabelWrapFlush : null]}>
      <View style={styles.sectionLabelAccent} />
      <Text style={styles.sectionLabelText}>{children}</Text>
    </View>
  );
}

function CheckboxRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.checkboxRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? colors.primary[600] : colors.text.muted} />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export function OnboardingHomeScreen({
  flow = 'signup',
  onFlowComplete,
  onCheckoutRequired,
}: {
  flow?: 'signup' | 'addProvider';
  onFlowComplete?: () => void;
  onCheckoutRequired?: (checkoutUrl: string) => void;
} = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { refreshMe, applyUser, setActiveRole, signOut } = useAuth();

  const completeOnboardingSession = useCallback(
    async (completedUser?: AuthUser | null) => {
      if (completedUser) {
        applyUser({
          ...completedUser,
          onboarding_completed: completedUser.onboarding_completed ?? true,
        });
        if (completedUser.roles?.includes('provider')) {
          await setActiveRole('provider');
        }
      }
      await refreshMe();
    },
    [applyUser, refreshMe, setActiveRole],
  );

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<onboardingApi.OnboardingMeta | null>(null);
  const [step, setStep] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Phone (shared UX)
  const [dialCountry, setDialCountry] = useState('US');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Seeker
  const [seekerServices, setSeekerServices] = useState<string[]>([]);
  const [seekerCity, setSeekerCity] = useState('');
  const [seekerState, setSeekerState] = useState('');
  const [seekerPostal, setSeekerPostal] = useState('');
  const [seekerCounty, setSeekerCounty] = useState('');
  const [seekerLocationLabel, setSeekerLocationLabel] = useState('');
  const [seekerCountry, setSeekerCountry] = useState('US');
  const [seekerLanguage, setSeekerLanguage] = useState('en');
  const [seekerChildrenCount, setSeekerChildrenCount] = useState('');
  const [seekerChildrenAges, setSeekerChildrenAges] = useState('');
  const [seekerDogs, setSeekerDogs] = useState('');

  // Advertiser
  const [advStreet, setAdvStreet] = useState('');
  const [advCity, setAdvCity] = useState('');
  const [advState, setAdvState] = useState('');
  const [advPostal, setAdvPostal] = useState('');
  const [advCounty, setAdvCounty] = useState('');
  const [advLocationLabel, setAdvLocationLabel] = useState('');
  const [advCountry, setAdvCountry] = useState('US');
  const [advLanguage, setAdvLanguage] = useState('en');
  const [advConfirmsIntent, setAdvConfirmsIntent] = useState(false);

  // Provider coverage
  const [covServeClient, setCovServeClient] = useState(false);
  const [covCountry, setCovCountry] = useState('usa');
  const [covState, setCovState] = useState('');
  const [covPostal, setCovPostal] = useState('');
  const [covRemote, setCovRemote] = useState(false);
  const [covInPerson, setCovInPerson] = useState(true);
  const [covRadius, setCovRadius] = useState('');
  const [covLanguage, setCovLanguage] = useState('en');

  // Provider location / business / pricing / subscription
  const [pStreet, setPStreet] = useState('');
  const [pLine2, setPLine2] = useState('');
  const [pCity, setPCity] = useState('');
  const [pState, setPState] = useState('');
  const [pPostal, setPPostal] = useState('');
  const [pCountry, setPCountry] = useState('US');
  const [pCounty, setPCounty] = useState('');
  const [pLocationLabel, setPLocationLabel] = useState('');

  const [bizName, setBizName] = useState('');
  const [bizTagline, setBizTagline] = useState('');
  const [bizBio, setBizBio] = useState('');
  const [bizLicense, setBizLicense] = useState('');
  const [bizYears, setBizYears] = useState('');

  const [providerPrimaryService, setProviderPrimaryService] = useState('');
  const [tutorDeliveryMethods, setTutorDeliveryMethods] = useState<string[]>([]);

  const [priceModel, setPriceModel] = useState('hourly');
  const [priceHourly, setPriceHourly] = useState('');
  const [priceConsult, setPriceConsult] = useState('');
  const [priceFreeConsult, setPriceFreeConsult] = useState(false);

  const [planUuid, setPlanUuid] = useState('');

  const loadMeta = useCallback(async (opts?: { country?: string; setStepFromServer?: boolean }) => {
    const res = await onboardingApi.meta({
      ...(opts?.country ? { country: opts.country } : {}),
      ...(flow === 'addProvider' ? { intent: 'provider' as const } : {}),
    });
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return null;
    }
    const m = res.data;
    setMeta(m);
    if (opts?.setStepFromServer) {
      setStep(m.initialStep);
    }
    return m;
  }, [flow]);

  const usStatesCache = useRef<onboardingApi.OnboardingMeta['stateOptions']>([]);

  const refreshStateOptions = useCallback((countryCode: string) => {
    void onboardingApi.meta({ country: countryCode, ...(flow === 'addProvider' ? { intent: 'provider' as const } : {}) }).then((res) => {
      if (res.success) {
        const opts = res.data.stateOptions ?? [];
        if (countryCode === 'US' && opts.length > 0) {
          usStatesCache.current = opts;
        }
        setMeta((prev) => (prev ? { ...prev, stateOptions: opts } : prev));
      }
    });
  }, [flow]);

  const hydrateForms = useCallback((m: onboardingApi.OnboardingMeta) => {
    const ex = m.existingData ?? {};
    const loc = ex.location ?? {};
    const profile = ex.profile ?? {};
    const cov = ex.coverage_area ?? {};
    const sa = ex['service-area'] ?? {};

    setSeekerCountry(m.user?.country || loc.country || 'US');
    setSeekerState(m.user?.state || loc.state || '');
    setSeekerCity(m.user?.city || loc.city || '');
    setSeekerPostal(m.user?.postal_code || loc.postal_code || '');
    setSeekerCounty(loc.county ?? '');
    setSeekerLocationLabel(loc.label ?? '');
    setSeekerLanguage(m.user?.preferred_language || 'en');
    setSeekerChildrenCount(profile.number_of_children != null ? String(profile.number_of_children) : '');
    setSeekerChildrenAges(profile.children_ages_text ?? '');
    setSeekerDogs(profile.dogs_count != null ? String(profile.dogs_count) : '');
    const sn = ex.services?.services_needed;
    setSeekerServices(Array.isArray(sn) ? [...new Set(sn.filter(Boolean))] : []);

    setAdvStreet(m.user?.address || loc.street || '');
    setAdvCity(loc.city || m.user?.city || '');
    setAdvState(loc.state || m.user?.state || '');
    setAdvPostal(loc.postal_code || m.user?.postal_code || '');
    setAdvCounty(loc.county ?? '');
    setAdvLocationLabel(loc.label ?? '');
    setAdvCountry(loc.country || m.user?.country || 'US');
    setAdvLanguage(ex.language?.preferred || m.user?.preferred_language || 'en');

    setCovServeClient(!!sa.serve_client_in_location);
    setCovCountry((cov.country || 'usa').toLowerCase());
    setCovState(cov.state ?? m.user?.state ?? '');
    setCovPostal(cov.postal_code ?? '');
    setCovRemote(!!sa.remote);
    setCovInPerson(sa.in_person !== false);
    setCovRadius(sa.radius != null ? String(sa.radius) : '');
    setCovLanguage(m.user?.preferred_language || 'en');

    setPStreet(loc.street ?? m.user?.address ?? '');
    setPLine2(loc.address_line_2 ?? '');
    setPCity(loc.city ?? m.user?.city ?? '');
    setPState(loc.state ?? m.user?.state ?? '');
    setPPostal(loc.postal_code ?? m.user?.postal_code ?? '');
    setPCountry(loc.country ?? m.user?.country ?? 'US');
    setPCounty(loc.county ?? '');
    setPLocationLabel(loc.label ?? '');

    const b = ex.business ?? {};
    setBizName(b.business_name ?? '');
    setBizTagline(b.tagline ?? '');
    setBizBio(b.bio ?? '');
    setBizLicense(b.license_number ?? '');
    setBizYears(b.years_experience != null ? String(b.years_experience) : '');

    const pr = ex.pricing ?? {};
    setPriceModel(pr.model || 'hourly');
    setPriceHourly(pr.hourly_rate != null ? String(pr.hourly_rate) : '');
    setPriceConsult(pr.consultation_fee != null ? String(pr.consultation_fee) : '');
    setPriceFreeConsult(!!pr.free_consultation);

    const sub = ex.subscription ?? {};
    setPlanUuid(sub.plan_uuid ?? '');

    const st = Array.isArray(ex.services?.types) ? ex.services.types.filter(Boolean).map(String) : [];
    const regType = ex.registration?.service_type ? String(ex.registration.service_type) : '';
    setProviderPrimaryService(st[0] ?? regType ?? '');
    setTutorDeliveryMethods(
      Array.isArray(ex.services?.delivery_methods)
        ? ex.services.delivery_methods.filter((x: unknown) => typeof x === 'string')
        : [],
    );

    const pv = m.phoneVerification;
    if (pv?.phone) {
      const digits = String(pv.phone).replace(/\D/g, '');
      const dialOptions = pv.phoneDialOptions ?? [];
      const sorted = [...dialOptions]
        .filter((o) => o.dial)
        .sort((a, b) => String(b.dial).length - String(a.dial).length);

      let matchedIso = 'US';
      let localDigits = digits.startsWith('1') ? digits.slice(1) : digits;

      for (const opt of sorted) {
        const dial = String(opt.dial).replace(/\D/g, '');
        if (dial && digits.startsWith(dial)) {
          matchedIso = opt.value;
          localDigits = digits.slice(dial.length);
          break;
        }
      }

      setPhoneLocal(localDigits.slice(0, 15));
      setOtpSent(digits.length >= 10);
      setDialCountry(matchedIso);
    } else {
      const defaultDial =
        pv?.phoneDialOptions?.find((o) => o.value === 'US')?.value ??
        pv?.phoneDialOptions?.[0]?.value ??
        'US';
      setDialCountry(defaultDial);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const m = await loadMeta({ setStepFromServer: true });
      setLoading(false);
      if (m) {
        hydrateForms(m);
        if (m.isProvider) {
          if ((m.stateOptions ?? []).length > 0) {
            usStatesCache.current = m.stateOptions;
          }
          const cov = String(m.existingData?.coverage_area?.country ?? 'usa').toLowerCase();
          const isoMap: Record<string, string> = { usa: 'US', canada: 'CA', uk: 'GB' };
          const iso = isoMap[cov];
          if (iso) {
            refreshStateOptions(iso);
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount only
  }, []);

  const isProviderFlow = !!meta?.isProvider;
  const isAdvertiserFlow = !!(meta?.isAdvertiser ?? false);
  const needsPhone = !!meta?.requiresPhoneVerification;

  const advanceAfterAddressSave = useCallback(
    (apiNextStep?: number) => {
      if (!needsPhone) {
        setStep(4);
        return;
      }
      setStep(typeof apiNextStep === 'number' ? apiNextStep : 3);
    },
    [needsPhone],
  );

  const isTutorProvider = useMemo(() => {
    const v = String(providerPrimaryService || '').toLowerCase();
    return TUTOR_SERVICE_VALUES.some((t) => t === v);
  }, [providerPrimaryService]);

  const showSeekerChildrenFields = useMemo(() => userSelectedBabysitterService(seekerServices), [seekerServices]);
  const showSeekerPetCountField = useMemo(() => userSelectedPetSitterService(seekerServices), [seekerServices]);

  useEffect(() => {
    if (!isTutorProvider) {
      setTutorDeliveryMethods([]);
    }
  }, [isTutorProvider]);

  const dialOpts = meta?.phoneVerification?.phoneDialOptions ?? [];
  const selectedDial =
    dialOpts.find((o) => o.value === dialCountry)?.dial ??
    dialOpts.find((o) => o.value === 'US')?.dial ??
    '1';

  const isNanp = useMemo(() => {
    const u = dialCountry.toUpperCase();
    return u === 'US' || u === 'CA';
  }, [dialCountry]);

  const fullPhoneDigits = useMemo(() => {
    const raw = phoneLocal.replace(/\D/g, '').slice(0, 14);
    const local = isNanp ? raw : raw.replace(/^0+/, '');
    return `+${selectedDial}${local}`;
  }, [phoneLocal, selectedDial, isNanp]);

  const phoneLocalSufficient = useMemo(() => {
    const local = phoneLocal.replace(/\D/g, '').slice(0, 14);
    const nanp = dialCountry === 'US' || dialCountry === 'CA';
    if (nanp) return local.length >= 10;
    return local.length >= 8 && local.length <= 14;
  }, [phoneLocal, dialCountry]);

  const progressTotal = isProviderFlow ? SIGNUP_FLOW_STEPS_PROVIDER : SIGNUP_FLOW_STEPS_USER;

  const pageTitle = useMemo(() => {
    if (!meta) return '';
    if (isProviderFlow) {
      if (needsPhone && step === 3) return 'Phone verification';
      if (step === 2) return 'Coverage area';
      if (step === 4) return 'Business address';
      if (step === 5) return 'Business profile';
      if (step === 6) return 'Pricing';
      if (step === 7) return 'Choose your subscription';
      return 'Continue setup';
    }
    if (isAdvertiserFlow) {
      if (step === 2) return 'Address details';
      if (needsPhone && step === 3) return 'Phone verification';
      if (step === 4) return 'Congratulations';
      return 'Onboarding';
    }
    // seeker
    if (needsPhone && step === 3) return 'Phone verification';
    if (step === 4) return 'Congratulations';
    return 'Onboarding';
  }, [meta, isProviderFlow, isAdvertiserFlow, needsPhone, step]);

  const isSeekerFlow = !!meta && !isProviderFlow && !isAdvertiserFlow;

  const pageSubtitle = useMemo((): string | null => {
    if (!meta) return null;
    if (isSeekerFlow && step === 2) {
      return 'Match with immigration and local service providers near you.';
    }
    if (isProviderFlow && step === 2) {
      return 'Where you meet clients. Your full business address is collected in the next step.';
    }
    if (isProviderFlow && step === 4) {
      return 'Shown on your profile for clients who book with you.';
    }
    if (isProviderFlow && step === 5) {
      return 'Help clients understand what you offer.';
    }
    return null;
  }, [meta, isProviderFlow, isSeekerFlow, step]);

  const toggleSeekerService = useCallback((value: string, label: string) => {
    const canonical = canonicalUserServiceTypeValue(value, label);
    if (canonical === USER_SELECT_SERVICES_LATER_VALUE) {
      setSeekerServices([USER_SELECT_SERVICES_LATER_VALUE]);
      setError(null);
      return;
    }
    setSeekerServices((prev) => {
      let next = prev.filter((v) => v !== USER_SELECT_SERVICES_LATER_VALUE);
      if (next.includes(canonical)) {
        next = next.filter((v) => v !== canonical);
      } else {
        next = [...next, canonical];
      }
      const real = next.filter((v) => v && v !== USER_SELECT_SERVICES_LATER_VALUE);
      if (real.length === 0) {
        return [USER_SELECT_SERVICES_LATER_VALUE];
      }
      return real.length > MAX_USER_SERVICES ? real.slice(0, MAX_USER_SERVICES) : real;
    });
    setError(null);
  }, []);

  async function onBackPress() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    await signOut();
  }

  const goBackStep = () => {
    setError(null);
    if (isProviderFlow) {
      if (step === 3) {
        if (otpSent) {
          setOtpSent(false);
          setOtp('');
          return;
        }
        setStep(2);
        return;
      }
      if (step === 4) {
        setStep(needsPhone ? 3 : 2);
        return;
      }
      if (step > 4) {
        setStep(step - 1);
        return;
      }
      void onBackPress();
      return;
    }
    if (isAdvertiserFlow) {
      if (step === 3) {
        if (otpSent) {
          setOtpSent(false);
          setOtp('');
          return;
        }
        setStep(2);
        return;
      }
      if (step === 4) {
        setStep(needsPhone ? 3 : 2);
        return;
      }
      void onBackPress();
      return;
    }
    // seeker
    if (step === 3) {
      if (otpSent) {
        setOtpSent(false);
        setOtp('');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 4) {
      setStep(needsPhone ? 3 : 2);
      return;
    }
    void onBackPress();
  };

  async function handleSeekerAddressContinue() {
    if (!meta) return;
    if (!seekerCity.trim() || !seekerState.trim() || !seekerCountry) {
      setError('Please complete city, state, and country to continue.');
      return;
    }
    if (seekerCountry.toUpperCase() === 'US' && !seekerPostal.trim()) {
      setError('Please add a ZIP or postal code to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const needBabysitter = userSelectedBabysitterService(seekerServices);
    const needPetSitter = userSelectedPetSitterService(seekerServices);
    const servicesPayload =
      seekerServices.length > 0
        ? seekerServices
        : [USER_SELECT_SERVICES_LATER_VALUE];
    const res = await onboardingApi.sendOtp({
      city: seekerCity.trim(),
      state: seekerState.trim(),
      country: seekerCountry,
      postal_code: seekerPostal.trim(),
      county: seekerCounty.trim() || undefined,
      location_label: seekerLocationLabel.trim() || undefined,
      preferred_language: seekerLanguage,
      number_of_children: needBabysitter
        ? seekerChildrenCount.trim() !== ''
          ? parseInt(seekerChildrenCount, 10)
          : null
        : null,
      children_ages_text: needBabysitter ? seekerChildrenAges.trim() || null : null,
      dogs_count: needPetSitter ? (seekerDogs.trim() !== '' ? parseInt(seekerDogs, 10) : null) : null,
      services_needed: servicesPayload,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    advanceAfterAddressSave(res.data?.nextStep);
  }

  async function handleSeekerSendPhoneOtp(): Promise<boolean> {
    setBusy(true);
    setError(null);
    // Phone step only — address was saved on step 2 (matches web `OnboardingPhoneVerification`).
    const res = await onboardingApi.sendOtp({
      phone: fullPhoneDigits,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return false;
    }
    setOtpSent(true);
    return true;
  }

  async function handlePhoneResend(): Promise<boolean> {
    if (isProviderFlow) return handleProviderSendPhoneOtp();
    if (isAdvertiserFlow) return handleAdvertiserSendOtp();
    return handleSeekerSendPhoneOtp();
  }

  async function handleVerifyOtp() {
    setBusy(true);
    setError(null);
    const res = await onboardingApi.verifyOtp(otp.replace(/\D/g, '').slice(0, 6));
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    await refreshMe();
    const m = await loadMeta();
    if (m) {
      hydrateForms(m);
      setMeta(m);
    }
    const next =
      typeof res.data?.nextStep === 'number'
        ? res.data.nextStep
        : m?.initialStep ?? 4;
    setStep(next);
    setOtpSent(false);
    setOtp('');
  }

  async function handleSeekerFinish() {
    setBusy(true);
    setError(null);
    const needBabysitter = userSelectedBabysitterService(seekerServices);
    const needPetSitter = userSelectedPetSitterService(seekerServices);
    const servicesForComplete =
      seekerServices.length > 0
        ? seekerServices
        : [USER_SELECT_SERVICES_LATER_VALUE];
    const res = await onboardingApi.complete({
      services_needed: servicesForComplete,
      city: seekerCity.trim(),
      state: seekerState.trim(),
      country: seekerCountry,
      postal_code: seekerPostal.trim(),
      county: seekerCounty.trim() || undefined,
      location_label: seekerLocationLabel.trim() || undefined,
      preferred_language: seekerLanguage,
      languages: [seekerLanguage],
      profile: {
        number_of_children:
          needBabysitter && seekerChildrenCount.trim() !== '' ? parseInt(seekerChildrenCount, 10) : null,
        children_ages_text: needBabysitter ? seekerChildrenAges.trim() || null : null,
        dogs_count: needPetSitter ? (seekerDogs.trim() !== '' ? parseInt(seekerDogs, 10) : null) : null,
      },
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    const completedUser = res.data?.user;
    await completeOnboardingSession(completedUser ?? null);
    onFlowComplete?.();
  }

  async function handleAdvertiserAddressContinue() {
    if (!advStreet.trim()) {
      setError('Please enter your street address to continue.');
      return;
    }
    if (!advCity.trim() || !advState.trim() || !advCountry) {
      setError('Please complete city, state, and country to continue.');
      return;
    }
    if (advCountry.toUpperCase() === 'US' && !advPostal.trim()) {
      setError('Please add a ZIP code to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onboardingApi.sendOtp({
      address: advStreet.trim(),
      city: advCity.trim(),
      state: advState.trim(),
      country: advCountry,
      postal_code: advPostal.trim(),
      county: advCounty.trim() || undefined,
      location_label: advLocationLabel.trim() || undefined,
      preferred_language: advLanguage,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    advanceAfterAddressSave(res.data?.nextStep);
  }

  async function handleAdvertiserSendOtp(): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await onboardingApi.sendOtp({
      phone: fullPhoneDigits,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return false;
    }
    setOtpSent(true);
    return true;
  }

  async function handleAdvertiserFinish() {
    if (!advConfirmsIntent) {
      setError('Please confirm you are posting job adverts to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onboardingApi.complete({
      address_line_1: advStreet.trim(),
      city: advCity.trim(),
      state: advState.trim(),
      country: advCountry,
      postal_code: advPostal.trim(),
      county: advCounty.trim() || undefined,
      location_label: advLocationLabel.trim() || undefined,
      preferred_language: advLanguage,
      languages: [advLanguage],
      services_needed: [],
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    await completeOnboardingSession(res.data?.user as AuthUser | undefined);
  }

  async function handleProviderCoverageContinue() {
    setBusy(true);
    setError(null);
    const res = await onboardingApi.sendOtp({
      coverage_country: covCountry,
      coverage_state: covState.trim(),
      coverage_postal_code: covPostal.trim() || undefined,
      serve_client_in_location: covServeClient,
      service_area: {
        remote: covRemote,
        in_person: covInPerson,
        radius: covRadius.trim() === '' ? undefined : parseFloat(covRadius),
        areas: [],
      },
      preferred_language: covLanguage,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    const next = typeof res.data?.nextStep === 'number' ? res.data.nextStep : 3;
    setStep(next);
  }

  async function handleProviderSendPhoneOtp(): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await onboardingApi.sendOtp({
      phone: fullPhoneDigits,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return false;
    }
    setOtpSent(true);
    return true;
  }

  async function saveProviderLocation() {
    setBusy(true);
    setError(null);
    const res = await onboardingApi.saveProgress('location', {
      street: pStreet.trim(),
      address_line_2: pLine2.trim() || undefined,
      city: pCity.trim(),
      state: pState.trim(),
      postal_code: pPostal.trim(),
      country: pCountry,
      county: pCounty.trim() || undefined,
      label: pLocationLabel.trim() || undefined,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setStep(5);
  }

  async function saveProviderBusiness() {
    const hasAny =
      bizName.trim() ||
      bizTagline.trim() ||
      bizBio.trim() ||
      bizLicense.trim() ||
      bizYears.trim();
    if (!providerPrimaryService.trim()) {
      setError('Choose the service you provide to continue.');
      return;
    }
    if (!hasAny) {
      setError('Please add at least one business detail to continue.');
      return;
    }
    if (isTutorProvider && tutorDeliveryMethods.length === 0) {
      setError('Select how you deliver your tutoring service to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const resBusiness = await onboardingApi.saveProgress('business', {
      business_name: bizName.trim() || undefined,
      tagline: bizTagline.trim() || undefined,
      bio: bizBio.trim() || undefined,
      license_number: bizLicense.trim() || undefined,
      years_experience: bizYears.trim() === '' ? null : parseInt(bizYears, 10),
    });
    if (!resBusiness.success) {
      setBusy(false);
      setError(friendlyApiErrorMessage(resBusiness));
      return;
    }
    const resServices = await onboardingApi.saveProgress('services', {
      types: [providerPrimaryService.trim()],
      delivery_methods: isTutorProvider ? tutorDeliveryMethods : [],
    });
    setBusy(false);
    if (!resServices.success) {
      setError(friendlyApiErrorMessage(resServices));
      return;
    }
    setStep(6);
  }

  async function saveProviderPricing() {
    if (priceModel === 'consultation') {
      if (!priceConsult.trim()) {
        setError('Please enter your consultation fee to continue.');
        return;
      }
    } else if (!priceHourly.trim()) {
      const rateLabel =
        priceModel === 'flat_rate' ? 'flat rate' :
        priceModel === 'custom' ? 'custom price' : 'hourly rate';
      setError(`Please enter your ${rateLabel} to continue.`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onboardingApi.saveProgress('pricing', {
      model: priceModel,
      hourly_rate: priceHourly.trim() === '' ? null : parseFloat(priceHourly),
      consultation_fee: priceConsult.trim() === '' ? null : parseFloat(priceConsult),
      free_consultation: priceFreeConsult,
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setStep(7);
  }

  async function finishProvider() {
    if (selectablePlans.length > 0 && !planUuid) {
      setError('Please choose a subscription plan to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onboardingApi.complete({
      address_line_1: pStreet.trim(),
      address_line_2: pLine2.trim() || undefined,
      city: pCity.trim(),
      state: pState.trim(),
      country: pCountry,
      postal_code: pPostal.trim(),
      county: pCounty.trim() || undefined,
      location_label: pLocationLabel.trim() || undefined,
      business: {
        business_name: bizName.trim() || undefined,
        tagline: bizTagline.trim() || undefined,
        bio: bizBio.trim() || undefined,
        license_number: bizLicense.trim() || undefined,
        years_experience: bizYears.trim() === '' ? null : parseInt(bizYears, 10),
      },
      services: {
        types: providerPrimaryService.trim() ? [providerPrimaryService.trim()] : [],
        delivery_methods: isTutorProvider ? tutorDeliveryMethods : [],
      },
      pricing: {
        model: priceModel,
        hourly_rate: priceHourly.trim() === '' ? null : parseFloat(priceHourly),
        consultation_fee: priceConsult.trim() === '' ? null : parseFloat(priceConsult),
        free_consultation: priceFreeConsult,
      },
      ...(selectablePlans.length > 0 ? { subscription: { plan_uuid: planUuid } } : {}),
    });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    const payload = res.data as { checkout_url?: string; user?: AuthUser } | undefined;
    const checkout = payload?.checkout_url;
    if (checkout && typeof checkout === 'string') {
      if (payload?.user) {
        applyUser({
          ...payload.user,
          onboarding_completed: payload.user.onboarding_completed ?? true,
        });
      }
      if (onCheckoutRequired) {
        onCheckoutRequired(checkout);
        return;
      }
      navigation.navigate('StripeCheckout', { checkoutUrl: checkout });
      return;
    }
    await completeOnboardingSession(payload?.user ?? null);
    onFlowComplete?.();
  }

  const coverageUsesStateList = PROVIDER_COVERAGE_USES_STATE_LIST.includes(
    covCountry as (typeof PROVIDER_COVERAGE_USES_STATE_LIST)[number],
  );

  const selectablePlans = useMemo(() => {
    const plans = meta?.subscriptionPlans ?? [];
    const stripeReady = !!meta?.stripeBillingReady;
    const selectedType = providerPrimaryService.trim();
    return plans.filter((p) => {
      if ((p.price_cents ?? 0) > 0 && !stripeReady) {
        return false;
      }
      const raw = p as onboardingApi.SubscriptionPlanOption & {
        serviceTypeOption?: { value?: string } | null;
        serviceTypeOptionId?: number | null;
      };
      const optId = raw.service_type_option_id ?? raw.serviceTypeOptionId;
      const optVal = raw.service_type_option?.value ?? raw.serviceTypeOption?.value;
      if (optId == null || optId === 0) {
        return true;
      }
      if (!selectedType) {
        return false;
      }
      if (optVal == null || optVal === '') {
        return true;
      }
      return String(optVal) === selectedType;
    });
  }, [meta, providerPrimaryService]);

  useEffect(() => {
    if (step !== 7 || selectablePlans.length !== 1 || planUuid) {
      return;
    }
    setPlanUuid(selectablePlans[0].uuid);
  }, [step, selectablePlans, planUuid]);

  const isPhoneVerificationStep = step === 3 && needsPhone;

  function toggleTutorDelivery(value: string) {
    setTutorDeliveryMethods((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  }

  const phoneDialFallback: onboardingApi.PhoneDialOption[] = [{ value: 'US', label: 'United States', dial: '1' }];

  const renderPhoneFields = () =>
    meta?.phoneVerification && needsPhone ? (
      <View>
        <OnboardingPhoneVerificationBlock
          phoneDialOptions={dialOpts.length > 0 ? dialOpts : phoneDialFallback}
          countryIso={dialCountry}
          onCountryIsoChange={(iso) => {
            setDialCountry(iso);
            setError(null);
          }}
          phoneLocalDigits={phoneLocal}
          onPhoneLocalChange={(d) => {
            setPhoneLocal(d);
            setError(null);
          }}
          otpSent={otpSent}
          otpCode={otp}
          onOtpCodeChange={(c) => {
            setOtp(c);
            setError(null);
          }}
          onResendPress={() => handlePhoneResend()}
          resendBusy={busy}
          fieldError={isPhoneVerificationStep ? error : null}
        />
      </View>
    ) : null;

  const renderSeeker = () => {
    if (!meta) return null;
    const dialFallback = [{ value: 'US', label: 'United States', dial: '1' }];
    return (
      <SeekerOnboardingContent
        step={step}
        meta={meta}
        needsPhone={needsPhone}
        seekerServices={seekerServices}
        onToggleService={toggleSeekerService}
        seekerCountry={seekerCountry}
        onSeekerCountryChange={(v) => {
          setSeekerCountry(v);
          refreshStateOptions(v);
        }}
        seekerState={seekerState}
        onSeekerStateChange={setSeekerState}
        seekerCity={seekerCity}
        onSeekerCityChange={setSeekerCity}
        seekerPostal={seekerPostal}
        onSeekerPostalChange={setSeekerPostal}
        seekerCounty={seekerCounty}
        onSeekerCountyChange={setSeekerCounty}
        seekerLocationLabel={seekerLocationLabel}
        onSeekerLocationLabelChange={setSeekerLocationLabel}
        seekerLanguage={seekerLanguage}
        onSeekerLanguageChange={setSeekerLanguage}
        seekerChildrenCount={seekerChildrenCount}
        onSeekerChildrenCountChange={setSeekerChildrenCount}
        seekerChildrenAges={seekerChildrenAges}
        onSeekerChildrenAgesChange={setSeekerChildrenAges}
        seekerDogs={seekerDogs}
        onSeekerDogsChange={setSeekerDogs}
        dialCountry={dialCountry}
        onDialCountryChange={(iso) => {
          setDialCountry(iso);
          setError(null);
        }}
        phoneLocal={phoneLocal}
        onPhoneLocalChange={(d) => {
          setPhoneLocal(d);
          setError(null);
        }}
        otp={otp}
        onOtpChange={(c) => {
          setOtp(c);
          setError(null);
        }}
        otpSent={otpSent}
        onResendPhone={() => handlePhoneResend()}
        resendBusy={busy}
        phoneFieldError={isPhoneVerificationStep ? error : null}
        phoneDialOptions={dialOpts.length > 0 ? dialOpts : dialFallback}
      />
    );
  };

  const renderAdvertiser = () => {
    if (!meta) return null;
    const stateUsePicklist = (meta.stateOptions?.length ?? 0) > 0;

    if (step === 2) {
      return (
        <>
          <AppInput label="Street address" value={advStreet} onChangeText={setAdvStreet} placeholder="123 Main St" required />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppInput label="City" value={advCity} onChangeText={setAdvCity} required />
            </View>
            {stateUsePicklist ? (
              <View style={{ flex: 1 }}>
                <PicklistField label="State" value={advState} options={meta.stateOptions} onChange={setAdvState} placeholder="Select" required />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <AppInput label="State / region" value={advState} onChangeText={setAdvState} required />
              </View>
            )}
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppInput label="Postal / ZIP" value={advPostal} onChangeText={setAdvPostal} required />
            </View>
            <View style={{ flex: 1 }}>
              <PicklistField
                label="Country"
                value={advCountry}
                options={meta.countryOptions}
                onChange={(v) => {
                  setAdvCountry(v);
                  refreshStateOptions(v);
                }}
                required
              />
            </View>
          </View>
          <AppInput label="County (optional)" value={advCounty} onChangeText={setAdvCounty} />
          <PicklistField label="Language preference" value={advLanguage} options={meta.languageOptions} onChange={setAdvLanguage} required />
        </>
      );
    }

    if (step === 3 && needsPhone) {
      return renderPhoneFields();
    }

    if (step === 4) {
      return (
        <View style={styles.intentCard}>
          <CheckboxRow
            checked={advConfirmsIntent}
            onToggle={() => setAdvConfirmsIntent((v) => !v)}
            label="I post job adverts and understand each ad requires a one-time publish payment."
          />
        </View>
      );
    }

    return null;
  };

  const renderProvider = () => {
    if (!meta) return null;
    const stateOpts = meta.stateOptions ?? [];
    const stateUsePicklist = stateOpts.length > 0 && coverageUsesStateList;

    if (step === 2) {
      return (
        <>
          <Text style={styles.leadParagraph}>
            Select the region where you offer services. You can refine your public business address afterward.
          </Text>
          <CheckboxRow
            checked={covServeClient}
            onToggle={() => setCovServeClient((v) => !v)}
            label="I serve the client in their location"
          />
          <PicklistField
            label="Coverage region"
            value={covCountry}
            options={[...PROVIDER_COVERAGE_COUNTRIES]}
            onChange={(v) => {
              setCovCountry(v);
              setCovState('');
              setCovPostal('');
              const isoMap: Record<string, string> = { usa: 'US', canada: 'CA', uk: 'GB' };
              const iso = isoMap[v];
              const instant = iso === 'US' ? (usStatesCache.current ?? []) : [];
              setMeta((prev) => (prev ? { ...prev, stateOptions: instant } : prev));
              if (iso) {
                refreshStateOptions(iso);
              }
            }}
            required
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              {stateUsePicklist ? (
                <PicklistField label="State" value={covState} options={stateOpts} onChange={setCovState} required />
              ) : (
                <AppInput label="State / region" value={covState} onChangeText={setCovState} required />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="City / ZIP code"
                value={covPostal}
                onChangeText={setCovPostal}
                required={covCountry === 'usa'}
              />
            </View>
          </View>
          <SectionLabel>How you deliver</SectionLabel>
          <Text style={styles.microHelp}>In-person, remote, or both—in your coverage region.</Text>
          <CheckboxRow checked={covInPerson} onToggle={() => setCovInPerson((v) => !v)} label="In-person services" />
          <CheckboxRow checked={covRemote} onToggle={() => setCovRemote((v) => !v)} label="Remote / virtual services" />
          {covInPerson ? (
            <AppInput label="Service radius (miles)" value={covRadius} onChangeText={setCovRadius} keyboardType="numeric" />
          ) : null}
          <PicklistField label="Language" value={covLanguage} options={meta.languageOptions} onChange={setCovLanguage} required />
        </>
      );
    }

    if (step === 3 && needsPhone) {
      return renderPhoneFields();
    }

    if (step === 4) {
      const pStatePicklist = pCountry.toUpperCase() === 'US' && (meta.stateOptions?.length ?? 0) > 0;
      return (
        <>
          <SectionLabel flushTop>Business address</SectionLabel>
          <Text style={styles.mutedBlock}>Enter your business address for your profile and client matching.</Text>
          <AppInput label="Address line 1" value={pStreet} onChangeText={setPStreet} required />
          <AppInput label="Address line 2 (optional)" value={pLine2} onChangeText={setPLine2} />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppInput label="City" value={pCity} onChangeText={setPCity} required />
            </View>
            {pStatePicklist ? (
              <View style={{ flex: 1 }}>
                <PicklistField label="State" value={pState} options={meta.stateOptions} onChange={setPState} required />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <AppInput label="State / region" value={pState} onChangeText={setPState} required />
              </View>
            )}
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppInput label="ZIP / postal" value={pPostal} onChangeText={setPPostal} required />
            </View>
            <View style={{ flex: 1 }}>
              <PicklistField
                label="Country"
                value={pCountry}
                options={meta.countryOptions}
                onChange={(v) => {
                  setPCountry(v);
                  refreshStateOptions(v);
                }}
                required
              />
            </View>
          </View>
          <AppInput label="County (optional)" value={pCounty} onChangeText={setPCounty} />
        </>
      );
    }

    if (step === 5) {
      return (
        <>
          <SectionLabel flushTop>Business</SectionLabel>
          <Text style={styles.mutedBlock}>Tell clients about your practice. You can refine these details later.</Text>
          {meta.serviceTypes.length > 0 ? (
            <PicklistField
              label="Service you provide"
              value={providerPrimaryService}
              options={meta.serviceTypes}
              onChange={(v) => {
                setProviderPrimaryService(v);
                setPlanUuid('');
                setError(null);
              }}
              placeholder="Choose the service you provide"
              required
            />
          ) : (
            <Text style={styles.help}>Service types are unavailable. Contact support if this continues.</Text>
          )}
          <AppInput label="Business name" value={bizName} onChangeText={setBizName} />
          <AppInput label="Tagline" value={bizTagline} onChangeText={setBizTagline} />
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            value={bizBio}
            onChangeText={setBizBio}
            placeholder="Experience, credentials, and how you help clients…"
            placeholderTextColor={colors.text.muted}
            multiline
            style={styles.textArea}
            textAlignVertical="top"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppInput label="License number" value={bizLicense} onChangeText={setBizLicense} />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="Years experience" value={bizYears} onChangeText={setBizYears} keyboardType="numeric" />
            </View>
          </View>
          {isTutorProvider ? (
            <View style={styles.tutorCard}>
              <Text style={styles.tutorTitle}>How do you deliver your tutoring service?</Text>
              {TUTOR_DELIVERY_METHOD_OPTIONS.map((option) => (
                <CheckboxRow
                  key={option.value}
                  checked={tutorDeliveryMethods.includes(option.value)}
                  onToggle={() => toggleTutorDelivery(option.value)}
                  label={option.label}
                />
              ))}
            </View>
          ) : null}
        </>
      );
    }

    if (step === 6) {
      return (
        <>
          <SectionLabel flushTop>Pricing</SectionLabel>
          <Text style={styles.mutedBlock}>Add pricing details for your services. You can adjust later.</Text>
          <PicklistField
            label="Pricing model"
            value={priceModel}
            options={[...PRICING_MODELS]}
            onChange={setPriceModel}
            required
          />
          {priceModel === 'hourly' ? (
            <AppInput label="Hourly rate (USD)" value={priceHourly} onChangeText={setPriceHourly} keyboardType="numeric" required />
          ) : priceModel === 'flat_rate' ? (
            <AppInput label="Flat rate (USD)" value={priceHourly} onChangeText={setPriceHourly} keyboardType="numeric" required />
          ) : priceModel === 'custom' ? (
            <AppInput label="Custom price (USD)" value={priceHourly} onChangeText={setPriceHourly} keyboardType="numeric" required />
          ) : null}
          <AppInput label="Consultation fee (USD)" value={priceConsult} onChangeText={setPriceConsult} keyboardType="numeric" />
          <CheckboxRow
            checked={priceFreeConsult}
            onToggle={() => setPriceFreeConsult((v) => !v)}
            label="Offer free initial consultations"
          />
        </>
      );
    }

    if (step === 7) {
      return (
        <>
          <SectionLabel flushTop>Subscription</SectionLabel>
          <Text style={styles.mutedBlock}>
            Choose a plan to publish your profile. Free plans activate instantly; paid plans open Stripe checkout in your browser.
          </Text>
          {selectablePlans.length === 0 ? (
            <Text style={styles.warnBox}>No plans are available right now. Please contact support.</Text>
          ) : (
            selectablePlans.map((plan) => {
              const selected = planUuid === plan.uuid;
              return (
                <Pressable
                  key={plan.uuid}
                  onPress={() => setPlanUuid(plan.uuid)}
                  style={[styles.planCard, selected && styles.planCardOn]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
                    <Text style={styles.planPrice}>
                      {(plan.price_cents ?? 0) <= 0
                        ? 'Free'
                        : `$${((plan.price_cents ?? 0) / 100).toFixed(0)} / ${plan.billing_cycle ?? 'period'}`}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selected ? colors.primary[600] : colors.text.muted}
                  />
                </Pressable>
              );
            })
          )}
        </>
      );
    }

    return null;
  };

  const primaryAction = () => {
    if (isProviderFlow) {
      if (step === 2) return { title: 'Continue', onPress: () => void handleProviderCoverageContinue() };
      if (step === 3 && needsPhone) return { title: otpSent ? 'Verify & continue' : 'Send code', onPress: () => (otpSent ? void handleVerifyOtp() : void handleProviderSendPhoneOtp()) };
      if (step === 4) return { title: 'Continue', onPress: () => void saveProviderLocation() };
      if (step === 5) return { title: 'Continue', onPress: () => void saveProviderBusiness() };
      if (step === 6) return { title: 'Continue', onPress: () => void saveProviderPricing() };
      if (step === 7) return { title: 'Finish setup', onPress: () => void finishProvider() };
    }
    if (isAdvertiserFlow) {
      if (step === 2) return { title: 'Continue', onPress: () => void handleAdvertiserAddressContinue() };
      if (step === 3 && needsPhone) {
        return {
          title: otpSent ? 'Verify & continue' : 'Send code',
          onPress: () => (otpSent ? void handleVerifyOtp() : void handleAdvertiserSendOtp()),
        };
      }
      if (step === 3 && !needsPhone) {
        return { title: 'Finish setup', onPress: () => void handleAdvertiserFinish() };
      }
      if (step === 4) return { title: 'Finish setup', onPress: () => void handleAdvertiserFinish() };
    }
    if (step === 2) return { title: 'Continue', onPress: () => void handleSeekerAddressContinue() };
    if (step === 3 && needsPhone) {
      return {
        title: otpSent ? 'Verify & continue' : 'Send code',
        onPress: () => (otpSent ? void handleVerifyOtp() : void handleSeekerSendPhoneOtp()),
      };
    }
    if (step === 3 && !needsPhone) {
      return { title: 'Finish setup', onPress: () => void handleSeekerFinish() };
    }
    if (step === 4) return { title: 'Finish setup', onPress: () => void handleSeekerFinish() };
    return null;
  };

  const action = primaryAction();
  const showPhoneInline = step === 3 && needsPhone;
  const otpDigits = otp.replace(/\D/g, '');
  const primaryDisabled =
    busy ||
    (showPhoneInline && (!otpSent ? !phoneLocalSufficient : otpDigits.length !== 6));

  if (loading) {
    return (
      <AppScreen variant="muted" style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="muted" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.backRow}>
            <Pressable
              onPress={() => void goBackStep()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary[700]} />
            </Pressable>
          </View>

          <AuthFlowProgressBar
            currentStep={step}
            totalSteps={progressTotal}
            variant={isSeekerFlow ? 'numbered' : 'bar'}
          />

          <Text style={[styles.title, !pageSubtitle ? styles.titleSolo : null]}>{pageTitle}</Text>
          {pageSubtitle ? <Text style={styles.titleSubtitle}>{pageSubtitle}</Text> : null}

          {!!error && !isPhoneVerificationStep ? <Text style={styles.error}>{error}</Text> : null}

          <View style={isSeekerFlow ? styles.seekerContent : styles.card}>
            {isProviderFlow ? renderProvider() : isAdvertiserFlow ? renderAdvertiser() : renderSeeker()}
          </View>

          {action ? (
            <AppButton title={action.title} onPress={action.onPress} loading={busy} disabled={primaryDisabled} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  backRow: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  titleSolo: {
    marginBottom: spacing.lg,
  },
  titleSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  error: { color: colors.danger, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${colors.primary[600]}14`,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  seekerContent: {
    marginBottom: spacing.lg,
  },
  sectionLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabelWrapFlush: {
    marginTop: 0,
  },
  sectionLabelAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
  },
  sectionLabelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  leadParagraph: {
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  help: { color: colors.text.secondary, marginBottom: spacing.md, fontSize: typography.fontSize.sm },
  mutedBlock: { color: colors.text.secondary, marginBottom: spacing.md, fontSize: typography.fontSize.sm, lineHeight: 20 },
  microHelp: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
  seekerSelectedBlock: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  seekerSelectedHeading: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  seekerSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  seekerSelectedRowLast: {
    borderBottomWidth: 0,
  },
  seekerSelectedText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    paddingRight: spacing.sm,
  },
  row2: { flexDirection: 'row', gap: spacing.md },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxLabel: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.primary, lineHeight: 22 },
  congrats: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#ECFDF5',
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  congratsTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#065F46', marginBottom: spacing.sm },
  congratsBody: { fontSize: typography.fontSize.sm, color: '#047857', textAlign: 'center', lineHeight: 20 },
  intentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  inputLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 120,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  warnBox: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.secondary,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  planCardOn: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
    borderWidth: 2,
  },
  planName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  planDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  planPrice: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  tutorCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary[600]}18`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  tutorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});
