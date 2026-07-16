import * as ImagePicker from 'expo-image-picker';

export type ProfileAvatarFile = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

/** Soft client-side ceiling; backend remains the source of truth for size limits. */
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

let pickInFlight = false;

/**
 * Opens the system photo picker for a profile avatar.
 * Does not request broad media-library permission on Android.
 */
export async function pickProfileAvatarFromLibrary(): Promise<ProfileAvatarFile | null> {
  if (pickInFlight) {
    return null;
  }

  pickInFlight = true;
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      legacy: false,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset?.uri) {
      throw new Error('The selected image could not be read. Please try another photo.');
    }

    if (asset.type === 'video' || asset.type === 'pairedVideo') {
      throw new Error('Please choose an image file.');
    }

    if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_AVATAR_BYTES) {
      throw new Error('That image is too large. Please choose a photo under 10 MB.');
    }

    const mime = (asset.mimeType || '').trim().toLowerCase() || 'image/jpeg';
    const name = asset.fileName?.trim() || `avatar-${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      name,
      type: mime === 'image/jpg' ? 'image/jpeg' : mime,
      file: (asset as { file?: Blob }).file,
    };
  } finally {
    pickInFlight = false;
  }
}
