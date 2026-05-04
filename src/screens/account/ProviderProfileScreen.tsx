import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import * as providerDashboardApi from '../../api/providerDashboardApi';
import * as onboardingApi from '../../api/onboardingApi';
import type { ProviderBottomTabParamList } from '../../navigation/ProviderBottomTabs';
import type { ProviderDashboardStackParamList } from '../provider/ProviderDashboardStack';
import type { ProfileStackParamList } from './ProfileStack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { backgroundCheckBody, backgroundCheckHeadline } from '../../utils/providerUi';

export function ProviderProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>>();
  const tabNavigation = navigation.getParent<BottomTabNavigationProp<ProviderBottomTabParamList>>();
  const { user, signOut } = useAuth();
  const [dash, setDash] = useState<providerDashboardApi.ProviderDashboardData | null>(null);
  const [meta, setMeta] = useState<onboardingApi.OnboardingMeta | null>(null);
  const formLoadedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const [dashRes, metaRes] = await Promise.all([providerDashboardApi.getProviderDashboard(), onboardingApi.meta()]);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (!dashRes.success) {
      setError(dashRes.message);
      return;
    }
    setDash(dashRes.data.dashboard);
    if (metaRes.success) {
      setMeta(metaRes.data);
      if (!formLoadedRef.current) {
        hydrateForm(metaRes.data, dashRes.data.dashboard);
        formLoadedRef.current = true;
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const prov = dash?.provider;
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || 'Profile';
  const bg = prov?.background_check_status;

  const hasDirtyFields = useMemo(() => {
    if (!meta) return false;
    const existing = meta.existingData ?? {};
    const business = (existing.business ?? {}) as Record<string, unknown>;
    const pricing = (existing.pricing ?? {}) as Record<string, unknown>;
    const services = (existing.services ?? {}) as Record<string, unknown>;
    const area = (existing['service-area'] ?? {}) as Record<string, unknown>;
    const areas = Array.isArray(area.areas) ? area.areas : [];
    const specs = Array.isArray(services.specializations) ? services.specializations : [];
    return (
      businessName.trim() !== String(business.business_name ?? prov?.business_name ?? '').trim() ||
      tagline.trim() !== String(business.tagline ?? '').trim() ||
      bio.trim() !== String(business.bio ?? '').trim() ||
      website.trim() !== String(business.website ?? '').trim() ||
      yearsExperience.trim() !== String(business.years_experience ?? '').trim() ||
      hourlyRate.trim() !== String(pricing.hourly_rate ?? '').trim() ||
      specializations.trim() !== specs.join(', ').trim() ||
      serviceAreas.trim() !== areas.join(', ').trim()
    );
  }, [meta, prov?.business_name, businessName, tagline, bio, website, yearsExperience, hourlyRate, specializations, serviceAreas]);

  const openDashboardScreen = (screen: keyof ProviderDashboardStackParamList) => {
    tabNavigation?.navigate('Dashboard', { screen });
  };

  const hydrateForm = (m: onboardingApi.OnboardingMeta, d: providerDashboardApi.ProviderDashboardData) => {
    const existing = m.existingData ?? {};
    const business = (existing.business ?? {}) as Record<string, unknown>;
    const pricing = (existing.pricing ?? {}) as Record<string, unknown>;
    const services = (existing.services ?? {}) as Record<string, unknown>;
    const area = (existing['service-area'] ?? {}) as Record<string, unknown>;
    const specs = Array.isArray(services.specializations) ? services.specializations : [];
    const areas = Array.isArray(area.areas) ? area.areas : [];
    setBusinessName(String(business.business_name ?? d.provider.business_name ?? '').trim());
    setTagline(String(business.tagline ?? '').trim());
    setBio(String(business.bio ?? '').trim());
    setWebsite(String(business.website ?? '').trim());
    setYearsExperience(String(business.years_experience ?? '').trim());
    setHourlyRate(String(pricing.hourly_rate ?? '').trim());
    setSpecializations(specs.join(', '));
    setServiceAreas(areas.join(', '));
  };

  const onSave = async () => {
    if (!meta) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    const specs = specializations
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const areas = serviceAreas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const saveCalls = await Promise.all([
      onboardingApi.saveProgress('business', {
        business_name: businessName.trim() || null,
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        website: website.trim() || null,
        years_experience: yearsExperience.trim() ? Number(yearsExperience.trim()) : null,
      }),
      onboardingApi.saveProgress('pricing', {
        model: 'hourly',
        hourly_rate: hourlyRate.trim() ? Number(hourlyRate.trim()) : null,
      }),
      onboardingApi.saveProgress('services', {
        specializations: specs,
      }),
      onboardingApi.saveProgress('service-area', {
        areas,
      }),
    ]);
    setSaving(false);
    const failed = saveCalls.find((r) => !r.success);
    if (failed && !failed.success) {
      setError(failed.message);
      return;
    }
    setSaveMessage('Saved');
  };

  return (
    <AppScreen variant="gradient" style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted, letterSpacing: 1.6, fontWeight: typography.fontWeight.semibold }}>
          PROFILE
        </Text>
        <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Profile
        </Text>
        <Text style={{ marginTop: spacing.sm, fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: typography.fontWeight.medium }}>
          {displayName}
        </Text>
        {!!user?.email && (
          <Text style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{user.email}</Text>
        )}

        {error ? <Text style={{ marginTop: spacing.md, color: colors.danger }}>{error}</Text> : null}
        {saveMessage ? (
          <Text style={{ marginTop: spacing.sm, color: colors.success, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
            {saveMessage}
          </Text>
        ) : null}

        {loading && !dash && !error ? (
          <View style={{ marginTop: spacing['2xl'], alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : null}

        {bg && bg !== 'clear' ? (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: 16,
              backgroundColor: '#fffbeb',
              borderWidth: 1,
              borderColor: '#fde68a',
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold, color: '#92400e' }}>{backgroundCheckHeadline(bg)}</Text>
            {backgroundCheckBody(bg) ? (
              <Text style={{ marginTop: spacing.xs, color: '#a16207', fontSize: typography.fontSize.sm, lineHeight: 20 }}>{backgroundCheckBody(bg)}</Text>
            ) : null}
            <Pressable
              onPress={() => openDashboardScreen('ProviderBackgroundCheck')}
              style={{
                marginTop: spacing.md,
                alignSelf: 'flex-start',
                backgroundColor: colors.primary[600],
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
                Background check
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
          <SectionHeading>Business</SectionHeading>
          <InputField label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="Business name" />
          <InputField label="Tagline" value={tagline} onChangeText={setTagline} placeholder="Tagline" />
          <InputField label="Bio" value={bio} onChangeText={setBio} placeholder="Bio" multiline />
          <InputField label="Website" value={website} onChangeText={setWebsite} placeholder="https://example.com" />

          <View style={{ marginTop: spacing.md }} />
          <SectionHeading>Services and pricing</SectionHeading>
          <InputField label="Years of experience" value={yearsExperience} onChangeText={setYearsExperience} keyboardType="numeric" placeholder="0" />
          <InputField label="Hourly rate (USD)" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" placeholder="0" />
          <InputField
            label="Specializations"
            value={specializations}
            onChangeText={setSpecializations}
            placeholder="Asylum, Family Petition"
          />
          <InputField label="Service areas" value={serviceAreas} onChangeText={setServiceAreas} placeholder="Dallas, Houston" />
        </View>

        <View style={{ marginTop: spacing['3xl'], marginBottom: spacing['3xl'] }}>
          <AppButton title="Save changes" onPress={() => void onSave()} loading={saving} disabled={!hasDirtyFields} />
          <View style={{ height: spacing.md }} />
          <AppButton title="Log out" onPress={() => void signOut()} variant="ghost" />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{children}</Text>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={{ marginBottom: spacing.xs, fontSize: typography.fontSize.sm, color: colors.text.muted, fontWeight: typography.fontWeight.medium }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: spacing.lg,
          paddingVertical: multiline ? spacing.md : spacing.md,
          fontSize: typography.fontSize.md,
          color: colors.text.primary,
          minHeight: multiline ? 120 : 52,
        }}
      />
    </View>
  );
}
