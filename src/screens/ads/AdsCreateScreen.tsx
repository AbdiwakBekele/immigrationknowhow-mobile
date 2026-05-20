import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '../../components/AppScreen';
import { AdvertiserScreenLayout } from '../../components/advertiser/AdvertiserScreenLayout';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as adsApi from '../../api/adsApi';

const HEADER_BAR_HEIGHT = 56;

export function AdsCreateScreen() {
  const navigation = useNavigation();
  const { role } = useAuth();
  const isAdvertiserPortal = role === 'advertiser';
  const ScreenWrap = isAdvertiserPortal ? AdvertiserScreenLayout : AppScreen;
  const screenWrapProps = isAdvertiserPortal
    ? { fill: true as const }
    : { variant: 'gradient' as const, safeAreaEdges: ['left', 'right'] as const, constrained: true as const };
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = insets.top + HEADER_BAR_HEIGHT;
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cta, setCta] = useState('https://');
  const [imageFile, setImageFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) {
      return;
    }
    const asset = result.assets[0];
    const filename = asset.fileName?.trim() || `ad-${Date.now()}.jpg`;
    const mime = asset.mimeType?.trim() || 'image/jpeg';
    setImageFile({
      uri: asset.uri,
      name: filename,
      type: mime,
    });
  };

  const submit = async () => {
    const t = title.trim();
    const d = description.trim();
    const u = cta.trim();
    if (!t || !d || !u) {
      Alert.alert('Create ad', 'Please fill title, description, and CTA URL.');
      return;
    }
    setBusy(true);
    const res = await adsApi.createAd({
      title: t,
      description: d,
      cta_url: u,
      image: imageFile,
    });
    setBusy(false);
    if (!res.success) {
      Alert.alert('Create ad', res.message);
      return;
    }
    Alert.alert('Ads', res.message);
    navigation.goBack();
  };

  return (
    <ScreenWrap {...screenWrapProps} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      >
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.subtitle}>Your ad will be reviewed (and may require payment) before publishing.</Text>

        <Text style={label()}>Title</Text>
        <TextInput placeholder="Ad title" value={title} onChangeText={setTitle} style={inp()} />

        <Text style={label()}>Description</Text>
        <TextInput placeholder="Describe your ad" value={description} onChangeText={setDescription} multiline style={[inp(), { minHeight: 110 }]} />

        <Text style={label()}>CTA URL</Text>
        <TextInput placeholder="https://…" value={cta} onChangeText={setCta} style={inp()} autoCapitalize="none" />

        <Text style={label()}>Ad image (optional)</Text>
        <Pressable
          onPress={() => void pickImage()}
          style={{
            marginTop: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: spacing.md,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
            {imageFile ? 'Change image' : 'Upload image'}
          </Text>
        </Pressable>
        {imageFile ? (
          <View style={{ marginTop: spacing.sm }}>
            <Image
              source={{ uri: imageFile.uri }}
              style={{ width: '100%', height: 170, borderRadius: 12, backgroundColor: colors.surfaceElevated }}
              contentFit="cover"
            />
            <Pressable onPress={() => setImageFile(null)} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.text.muted }}>Remove image</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => void submit()}
          disabled={busy}
          style={{
            marginTop: spacing.lg,
            backgroundColor: colors.primary[600],
            padding: spacing.md,
            borderRadius: 12,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={{ color: colors.text.inverse, textAlign: 'center', fontWeight: typography.fontWeight.semibold }}>Create</Text>
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
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'] * 2,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});

