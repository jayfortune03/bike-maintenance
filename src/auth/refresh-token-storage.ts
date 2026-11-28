import * as SecureStore from 'expo-secure-store';
import type { RefreshTokenStorage } from './session';

const KEY = 'motor-care.refresh-token';
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY } as const;

export const refreshTokenStorage: RefreshTokenStorage = {
  get: () => SecureStore.getItemAsync(KEY, OPTIONS),
  set: (token) => SecureStore.setItemAsync(KEY, token, OPTIONS),
  clear: () => SecureStore.deleteItemAsync(KEY, OPTIONS),
};
