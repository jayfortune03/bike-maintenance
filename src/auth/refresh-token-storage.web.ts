import type { RefreshTokenStorage } from './session';

let refreshToken: string | null = null;

export const refreshTokenStorage: RefreshTokenStorage = {
  get: async () => refreshToken,
  set: async (token) => { refreshToken = token; },
  clear: async () => { refreshToken = null; },
};
