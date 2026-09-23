import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type AdImageFile = {
  uri: string;
  name: string;
  type: string;
};

/** Soft client-side ceiling; backend remains the source of truth for size limits. */
const MAX_AD_IMAGE_BYTES = 10 * 1024 * 1024;

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

let pickInFlight = false;

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
  if (!asset?.uri) {
    return null;
  }

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

  if (!ALLOWED_MIME.has(mime)) {
    return null;
  }

  const ext = extensionForMime(mime);
  const rawName = asset.fileName?.trim();
  const name =
    rawName && /\.[a-z0-9]+$/i.test(rawName)
      ? rawName.replace(/\.[a-z0-9]+$/i, `.${ext}`)
      : `ad-${Date.now()}.${ext}`;

  return { uri: asset.uri, name, type: mime };
}

/** Pick a still image for ad upload via the system photo picker (no broad gallery permission). */
export async function pickAdImageFromLibrary(): Promise<AdImageFile | null> {
  if (pickInFlight) {
    return null;
  }

  pickInFlight = true;
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      legacy: false,
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
    if (!asset?.uri) {
      throw new Error('The selected image could not be read. Please try another photo.');
    }

    if (asset.type === 'livePhoto') {
      throw new Error('Live Photos are not supported. Please choose a still image.');
    }

    if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_AD_IMAGE_BYTES) {
      throw new Error('That image is too large. Please choose a photo under 10 MB.');
    }

    const normalized = normalizePickedAdImage(asset);
    if (!normalized) {
      throw new Error('Please choose a JPEG, PNG, GIF, WebP, or HEIC image.');
    }

    return normalized;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not use that image.');
  } finally {
    pickInFlight = false;
  }
}
