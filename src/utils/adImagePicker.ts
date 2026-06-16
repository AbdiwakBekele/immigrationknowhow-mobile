import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type AdImageFile = {
  uri: string;
  name: string;
  type: string;
};

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/heic',
  'image/heif',
]);

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/bmp':
      return 'bmp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'jpg';
  }
}

function guessMimeFromUri(uri: string): string {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/jpeg';
}

export function normalizePickedAdImage(asset: ImagePicker.ImagePickerAsset): AdImageFile | null {
  if (asset.type === 'video' || asset.type === 'pairedVideo') {
    return null;
  }

  let mime = (asset.mimeType || '').trim().toLowerCase();
  if (mime === 'image/jpg') {
    mime = 'image/jpeg';
  }
  if (!mime || mime === 'application/octet-stream' || !ALLOWED_MIME.has(mime)) {
    mime = guessMimeFromUri(asset.uri);
  }

  const ext = extensionForMime(mime);
  const rawName = asset.fileName?.trim();
  const name =
    rawName && /\.[a-z0-9]+$/i.test(rawName)
      ? rawName.replace(/\.[a-z0-9]+$/i, `.${ext}`)
      : `ad-${Date.now()}.${ext}`;

  return { uri: asset.uri, name, type: mime };
}

/** Pick a still image for ad upload; iOS uses a compatible representation (JPEG when possible). */
export async function pickAdImageFromLibrary(): Promise<AdImageFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Photo library permission is required to upload an image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    ...(Platform.OS === 'ios'
      ? {
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        }
      : {}),
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  if (asset.type === 'livePhoto') {
    throw new Error('Live Photos are not supported. Please choose a still image.');
  }

  const normalized = normalizePickedAdImage(asset);
  if (!normalized) {
    throw new Error('Please choose an image file.');
  }

  return normalized;
}
