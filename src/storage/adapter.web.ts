import type { StateStorage } from 'zustand/middleware';

const storage = typeof localStorage === 'undefined' ? undefined : localStorage;

export const mmkvStorage: StateStorage = {
  getItem: (name) => storage?.getItem(name) ?? null,
  setItem: (name, value) => storage?.setItem(name, value),
  removeItem: (name) => storage?.removeItem(name),
};
