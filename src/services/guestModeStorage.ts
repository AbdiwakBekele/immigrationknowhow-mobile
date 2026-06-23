import * as SecureStore from 'expo-secure-store';

const GUEST_MODE_KEY = 'auth.guest_mode';

let secureStorageSupported: boolean | undefined;

async function useSecureStorage(): Promise<boolean> {
  if (secureStorageSupported !== undefined) {
    return secureStorageSupported;
  }
  secureStorageSupported = await SecureStore.isAvailableAsync();
  return secureStorageSupported;
}

function getFromLocalStorage(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveToLocalStorage(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(GUEST_MODE_KEY, '1');
    } else {
      localStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch {
    /* private mode / disabled storage */
  }
}

export async function getGuestMode(): Promise<boolean> {
  if (await useSecureStorage()) {
    const value = await SecureStore.getItemAsync(GUEST_MODE_KEY);
    return value === '1';
  }
  return getFromLocalStorage();
}

export async function setGuestMode(enabled: boolean): Promise<void> {
  if (await useSecureStorage()) {
    if (enabled) {
      await SecureStore.setItemAsync(GUEST_MODE_KEY, '1');
    } else {
      await SecureStore.deleteItemAsync(GUEST_MODE_KEY);
    }
    return;
  }
  saveToLocalStorage(enabled);
}

export async function clearGuestMode(): Promise<void> {
  await setGuestMode(false);
}
