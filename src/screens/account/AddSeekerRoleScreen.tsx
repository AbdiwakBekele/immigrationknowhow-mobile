import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../api/authApi';
import * as rolesApi from '../../api/rolesApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import { OnboardingSectionCard } from '../onboarding/components/OnboardingSectionCard';
import { UserServicesTagField } from '../onboarding/onboardingPickers';
import {
  USER_SELECT_SERVICES_LATER_LABEL,
  USER_SELECT_SERVICES_LATER_VALUE,
  canonicalUserServiceTypeValue,
  userSelectedBabysitterService,
  userSelectedPetSitterService,
} from '../onboarding/onboardingConstants';
import type { ProfileStackParamList } from './ProfileStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const HEADER_BAR_HEIGHT = 56;
const MAX_SERVICES = 8;

export function AddSeekerRoleScreen() {
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = insets.top + HEADER_BAR_HEIGHT;
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { refreshMe, setActiveRole } = useAuth();

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [servicesNeeded, setServicesNeeded] = useState<string[]>([USER_SELECT_SERVICES_LATER_VALUE]);
  const [servicesLimitError, setServicesLimitError] = useState('');
  const [childrenCount, setChildrenCount] = useState('');
  const [childrenAges, setChildrenAges] = useState('');
  const [dogsCount, setDogsCount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOptions(true);
      const res = await authApi.registerMeta();
      if (!active) return;
      setLoadingOptions(false);
      if (res.success && res.data?.service_types_user) {
        setServiceTypeOptions(res.data.service_types_user.map((o) => ({ value: String(o.value), label: String(o.label) })));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const serviceOptions = useMemo(() => {
    const base = serviceTypeOptions.map((o) => ({
      value: String(o.value),
      label: String(o.label),
    }));
    const hasLater = base.some(
      (o) => canonicalUserServiceTypeValue(o.value, o.label) === USER_SELECT_SERVICES_LATER_VALUE,
    );
    return hasLater ? base : [{ value: USER_SELECT_SERVICES_LATER_VALUE, label: USER_SELECT_SERVICES_LATER_LABEL }, ...base];
  }, [serviceTypeOptions]);

  const showChildrenFields = useMemo(() => userSelectedBabysitterService(servicesNeeded), [servicesNeeded]);
  const showPetFields = useMemo(() => userSelectedPetSitterService(servicesNeeded), [servicesNeeded]);

  const toggleService = useCallback((value: string, label: string) => {
    const canonical = canonicalUserServiceTypeValue(value, label);
    if (canonical === USER_SELECT_SERVICES_LATER_VALUE) {
      setServicesLimitError('');
      setServicesNeeded([USER_SELECT_SERVICES_LATER_VALUE]);
      setError(null);
      return;
    }
    setServicesNeeded((prev) => {
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
      return real.length > MAX_SERVICES ? real.slice(0, MAX_SERVICES) : real;
    });
    setServicesLimitError('');
    setError(null);
  }, []);

  const handleToggleService = useCallback(
    (value: string, label: string) => {
      const canonical = canonicalUserServiceTypeValue(value, label);
      if (canonical === USER_SELECT_SERVICES_LATER_VALUE) {
        toggleService(value, label);
        return;
      }
      const real = servicesNeeded.filter((v) => v !== USER_SELECT_SERVICES_LATER_VALUE);
      if (!servicesNeeded.includes(canonical) && real.length >= MAX_SERVICES) {
        setServicesLimitError(`You can select up to ${MAX_SERVICES} services.`);
        return;
      }
      toggleService(value, label);
    },
    [servicesNeeded, toggleService],
  );

  const onSubmit = async () => {
    setError(null);
    setServicesLimitError('');

    const realServices = servicesNeeded.filter((v) => v && v !== USER_SELECT_SERVICES_LATER_VALUE);
    const servicesPayload =
      realServices.length > 0 ? realServices : [USER_SELECT_SERVICES_LATER_VALUE];

    const needBabysitter = userSelectedBabysitterService(servicesPayload);
    const needPetSitter = userSelectedPetSitterService(servicesPayload);

    setBusy(true);
    const payload: rolesApi.EnableSeekerPayload = {
      services_needed: servicesPayload,
      number_of_children:
        needBabysitter && childrenCount.trim() !== '' ? parseInt(childrenCount, 10) : null,
      children_ages_text: needBabysitter ? childrenAges.trim() || null : null,
      dogs_count: needPetSitter && dogsCount.trim() !== '' ? parseInt(dogsCount, 10) : null,
    };
    const res = await rolesApi.enableSeeker(payload);
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    await refreshMe();
    await setActiveRole('user');
    navigation.goBack();
  };

  return (
    <AppScreen variant="gradient" safeAreaEdges={['left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: spacing['3xl'] + insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          nestedScrollEnabled
        >
          <Text style={styles.title}>Create service seeker account</Text>
          <Text style={styles.subtitle}>
            Your name, contact details, and location are already on file. Choose the services you need and add household
            details when relevant.
          </Text>

          {loadingOptions ? (
            <ActivityIndicator color={colors.primary[600]} style={styles.loader} />
          ) : (
            <View style={styles.sections}>
              <OnboardingSectionCard
                title="What do you need?"
                subtitle="Select up to 8 services, or choose to decide later."
              >
                <UserServicesTagField
                  label="Services needed (up to 8)"
                  placeholder="Choose a service to add"
                  options={serviceOptions}
                  selectedValues={servicesNeeded}
                  onToggle={handleToggleService}
                  limitError={servicesLimitError}
                  maxSelections={MAX_SERVICES}
                />
              </OnboardingSectionCard>

              {(showChildrenFields || showPetFields) && (
                <OnboardingSectionCard
                  title="Household details"
                  subtitle="Helps providers prepare for your visit."
                >
                  {showChildrenFields ? (
                    <>
                      <AppInput
                        label="Number of children"
                        value={childrenCount}
                        onChangeText={setChildrenCount}
                        keyboardType="numeric"
                        placeholder="e.g. 2"
                      />
                      <AppInput
                        label="Children's ages"
                        value={childrenAges}
                        onChangeText={setChildrenAges}
                        placeholder="e.g. 4, 9"
                      />
                    </>
                  ) : null}
                  {showPetFields ? (
                    <AppInput
                      label="Number of pets"
                      value={dogsCount}
                      onChangeText={setDogsCount}
                      keyboardType="numeric"
                      placeholder="How many pets in the household?"
                    />
                  ) : null}
                </OnboardingSectionCard>
              )}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AppButton
            title="Create seeker account"
            onPress={() => void onSubmit()}
            loading={busy}
            disabled={loadingOptions}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sections: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing['2xl'],
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
  },
});
