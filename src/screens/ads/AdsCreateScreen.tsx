import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as adsApi from '../../api/adsApi';

export function AdsCreateScreen() {
  const navigation = useNavigation();
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
    <AppScreen style={{ padding: spacing.xl }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Create Ad
        </Text>

        <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>
          Your ad will be reviewed (and may require payment) before publishing.
        </Text>

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
    </AppScreen>
  );
}

function label() {
  return { marginTop: spacing.lg, fontWeight: typography.fontWeight.semibold, color: colors.text.primary } as const;
}

function inp() {
  return {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  } as const;
}

