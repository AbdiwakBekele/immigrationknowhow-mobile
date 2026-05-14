import * as SecureStore from 'expo-secure-store';
import type { UserRole } from '../types/user';

const ACTIVE_ROLE_KEY = 'auth.active_role';

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
    return localStorage.getItem(ACTIVE_ROLE_KEY);
  } catch {
    return null;
  }
}

function saveToLocalStorage(role: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  } catch {
    /* private mode / disabled storage */
  }
}

function removeFromLocalStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export async function getActiveRole(): Promise<UserRole | null> {
  const raw = (await useSecureStorage())
    ? await SecureStore.getItemAsync(ACTIVE_ROLE_KEY)
    : getFromLocalStorage();
  if (raw === 'user' || raw === 'provider' || raw === 'advertiser') {
    return raw;
  }
  return null;
}

export async function setActiveRole(role: UserRole): Promise<void> {
  if (await useSecureStorage()) {
    await SecureStore.setItemAsync(ACTIVE_ROLE_KEY, role);
    return;
  }
  saveToLocalStorage(role);
}

export async function clearActiveRole(): Promise<void> {
  if (await useSecureStorage()) {
    await SecureStore.deleteItemAsync(ACTIVE_ROLE_KEY);
    return;
  }
  removeFromLocalStorage();
}
