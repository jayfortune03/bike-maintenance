import { AccountApi } from './account-api';
import { refreshTokenStorage } from './refresh-token-storage';
import { AuthSession } from './session';
import { KySessionTransport } from './transport';

export const authSession = new AuthSession(new KySessionTransport(), refreshTokenStorage);
export const accountApi = new AccountApi(authSession);
