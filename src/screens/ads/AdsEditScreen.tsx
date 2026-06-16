import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '../../components/AppScreen';
import { AdvertiserScreenLayout } from '../../components/advertiser/AdvertiserScreenLayout';
import { useAuth } from '../../context/AuthContext';
import { useAdvertiserStyles } from '../../context/AdvertiserLayoutContext';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import * as adsApi from '../../api/adsApi';
import { OneTimePurchaseNote } from '../../components/pricing/OneTimePurchaseNote';
import { formatAdPricePerUnit } from '../../utils/adUi';
import { pickAdImageFromLibrary, type AdImageFile } from '../../utils/adImagePicker';
import type { AdsStackParamList } from './AdsStack';

const HEADER_BAR_HEIGHT = 56;

type Route = RouteProp<AdsStackParamList, 'AdsEdit'>;

function adStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    published: 'Published',
    pending_payment: 'Pending payment',
    pending_approval: 'Pending approval',
    rejected: 'Rejected',
    suspended: 'Suspended',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

export function AdsEditScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<AdsStackParamList>>();
  const { role } = useAuth();
  const isAdvertiserPortal = role === 'advertiser';
  const advertiserUi = useAdvertiserStyles();
  const ScreenWrap = isAdvertiserPortal ? AdvertiserScreenLayout : AppScreen;
  const screenWrapProps = isAdvertiserPortal
    ? { fill: true as const }
    : { variant: 'gradient' as const, safeAreaEdges: ['left', 'right'] as const, constrained: true as const };
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = insets.top + HEADER_BAR_HEIGHT;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cta, setCta] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<AdImageFile | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [priceCurrency, setPriceCurrency] = useState<string>('USD');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const res = await adsApi.listAds();
        if (res.success) {
          setPriceCents(res.data?.ad_posting_price?.amount_cents ?? null);
          setPriceCurrency(res.data?.ad_posting_price?.currency ?? 'USD');
        }
      })();
    }, []),
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await adsApi.getAd(route.params.uuid);
      setLoading(false);
      if (!res.success) {
        Alert.alert('Ads', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }
      const ad = res.data?.ad as {
        title?: string;
        description?: string;
        cta_url?: string;
        image_url?: string | null;
        status?: string;
        price_cents?: number;
        currency?: string;
      };
      setTitle(ad?.title ?? '');
      setDescription(ad?.description ?? '');
      setCta(ad?.cta_url ?? 'https://');
      setExistingImageUrl(ad?.image_url ?? null);
      setStatus(ad?.status ?? '');
      if (typeof ad?.price_cents === 'number') {
        setPriceCents(ad.price_cents);
      }
      if (ad?.currency) {
        setPriceCurrency(ad.currency);
      }
    })();
  }, [navigation, route.params.uuid]);

  const adPrice = formatAdPricePerUnit(priceCents ?? undefined, priceCurrency);

  const pickImage = async () => {
    try {
      const picked = await pickAdImageFromLibrary();
      if (picked) {
        setImageFile(picked);
        setClearImage(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not use that image.';
      Alert.alert('Upload image', message);
    }
  };

  const displayImageUri = imageFile?.uri ?? (clearImage ? null : existingImageUrl ? resolveMediaUrl(existingImageUrl) : null);

  const removeImage = () => {
    if (imageFile) {
      setImageFile(null);
      return;
    }
    if (existingImageUrl) {
      setClearImage(true);
    }
  };

  const submit = async () => {
    const t = title.trim();
    const d = description.trim();
    const u = cta.trim();
    if (!t || !d || !u) {
      Alert.alert('Edit ad', 'Please fill title, description, and CTA URL.');
      return;
    }
    setBusy(true);
    const res = await adsApi.updateAd(route.params.uuid, {
      title: t,
      description: d,
      cta_url: u,
      image: imageFile,
      clear_image: clearImage && !imageFile,
    });
    setBusy(false);
    if (!res.success) {
      Alert.alert('Edit ad', res.message);
      return;
    }
    Alert.alert('Ads', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  if (loading) {
    return (
      <ScreenWrap {...screenWrapProps} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap {...screenWrapProps} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      >
        <ScrollView
          style={[styles.flex, isAdvertiserPortal && advertiserUi.scroll]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isAdvertiserPortal && advertiserUi.scrollContent]}
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.subtitle}>Status: {adStatusLabel(status)}</Text>

          {adPrice && (status === 'pending_payment' || Number(priceCents) > 0) ? (
            <View style={styles.pricingNote}>
              <Text style={styles.pricingAmount}>{adPrice}</Text>
              <OneTimePurchaseNote compact />
              {status === 'pending_payment' ? (
                <Text style={styles.pricingHint}>Payment is required before this ad can be published.</Text>
              ) : null}
            </View>
          ) : null}

          {status === 'suspended' ? (
            <View style={styles.noticeSuspended}>
              <Text style={styles.noticeSuspendedText}>
                This ad was suspended and is hidden from the public site. Saving changes will submit it for approval again.
              </Text>
            </View>
          ) : null}

          {status === 'published' ? (
            <View style={styles.noticePublished}>
              <Text style={styles.noticePublishedText}>
                This ad is live. Saving changes will take it offline until an administrator approves it again.
              </Text>
            </View>
          ) : null}

          <Text style={label()}>Title</Text>
          <TextInput placeholder="Ad title" value={title} onChangeText={setTitle} style={inp()} />

          <Text style={label()}>Description</Text>
          <TextInput
            placeholder="Describe your ad"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[inp(), { minHeight: 110 }]}
          />

          <Text style={label()}>CTA URL</Text>
          <TextInput placeholder="https://…" value={cta} onChangeText={setCta} style={inp()} autoCapitalize="none" />

          <Text style={label()}>Ad image (optional)</Text>
          <Pressable onPress={() => void pickImage()} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>{displayImageUri ? 'Change image' : 'Upload image'}</Text>
          </Pressable>
          {displayImageUri ? (
            <View style={{ marginTop: spacing.sm }}>
              <Image
                source={{ uri: displayImageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <Pressable onPress={removeImage} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.text.muted }}>Remove image</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable onPress={() => void submit()} disabled={busy} style={[styles.saveButton, busy && styles.saveButtonDisabled]}>
            {busy ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save changes</Text>
            )}
          </Pressable>

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrap>
  );
}

function label() {
  return { marginTop: spacing.md, fontWeight: typography.fontWeight.semibold, color: colors.text.primary } as const;
}

function inp() {
  return {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  } as const;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'] * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  pricingNote: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  pricingAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  pricingHint: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  noticeSuspended: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  noticeSuspendedText: {
    fontSize: typography.fontSize.sm,
    color: '#5b21b6',
    lineHeight: 20,
  },
  noticePublished: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
  },
  noticePublishedText: {
    color: '#0369a1',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  uploadButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  uploadButtonText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text.inverse,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
  },
});
