import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth.token';

let secureStorageSupported: boolean | undefined;

async function useSecureStorage(): Promise<boolean> {
  if (secureStorageSupported !== undefined) {
    return secureStorageSupported;
  }
  secureStorageSupported = await SecureStore.isAvailableAsync();
  return secureStorageSupported;
}

function getFromLocalStorage(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToLocalStorage(token: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode / disabled storage */
  }
}

function removeFromLocalStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function getToken(): Promise<string | null> {
  if (await useSecureStorage()) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return getFromLocalStorage();
}

export async function setToken(token: string): Promise<void> {
  if (await useSecureStorage()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }
  saveToLocalStorage(token);
}

export async function clearToken(): Promise<void> {
  if (await useSecureStorage()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }
  removeFromLocalStorage();
}
