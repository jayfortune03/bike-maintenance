import ky, { HTTPError, NetworkError, TimeoutError } from 'ky';
import { authPayloadSchema, type AuthCredentials, type AuthMode, type AuthPayload } from './contracts';
import { ApiClientError } from './errors';

type AuthenticatedRequest = {
  readonly path: string;
  readonly method: 'GET' | 'POST';
  readonly accessToken: string;
  readonly json?: unknown;
  readonly signal?: AbortSignal;
};

export interface SessionTransport {
  authenticate(mode: AuthMode, credentials: AuthCredentials): Promise<AuthPayload>;
  refresh(refreshToken: string): Promise<AuthPayload>;
  logout(refreshToken: string): Promise<void>;
  send(request: AuthenticatedRequest): Promise<unknown>;
}

function localHttpHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '10.0.2.2';
}

function resolveUrl(path: string, configuredBaseUrl?: string): string {
  const raw = configuredBaseUrl?.trim();
  if (!raw) throw new ApiClientError('configuration', 'EXPO_PUBLIC_API_BASE_URL is not configured');

  let base: URL;
  try {
    base = new URL(raw.endsWith('/') ? raw : `${raw}/`);
  } catch (error) {
    if (error instanceof TypeError) throw new ApiClientError('configuration', 'EXPO_PUBLIC_API_BASE_URL is invalid');
    throw error;
  }
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && localHttpHost(base.hostname))) {
    throw new ApiClientError('configuration', 'The API URL must use HTTPS outside local development');
  }
  return new URL(path.replace(/^\//, ''), base).toString();
}

async function requestJson(input: {
  readonly url: string;
  readonly method: 'GET' | 'POST';
  readonly json?: unknown;
  readonly accessToken?: string;
  readonly signal?: AbortSignal;
}): Promise<unknown> {
  try {
    const headers = input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : undefined;
    const options = { method: input.method, headers, signal: input.signal, retry: 0, timeout: 15_000 } as const;
    const response = input.json === undefined
      ? await ky(input.url, options)
      : await ky(input.url, { ...options, json: input.json });
    return response.status === 204 ? undefined : response.json<unknown>();
  } catch (error) {
    if (error instanceof HTTPError) throw new ApiClientError('http', 'API request rejected', error.response.status);
    if (error instanceof NetworkError || error instanceof TimeoutError) throw new ApiClientError('network', 'API tidak dapat dihubungi');
    throw error;
  }
}

export class KySessionTransport implements SessionTransport {
  constructor(private readonly configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL) {}

  async authenticate(mode: AuthMode, credentials: AuthCredentials): Promise<AuthPayload> {
    let path: string;
    switch (mode) {
      case 'login':
        path = 'auth/login';
        break;
      case 'register':
        path = 'auth/register';
        break;
      default: {
        const unreachable: never = mode;
        return unreachable;
      }
    }
    return authPayloadSchema.parse(await requestJson({
      url: resolveUrl(path, this.configuredBaseUrl),
      method: 'POST',
      json: credentials,
    }));
  }

  async refresh(refreshToken: string): Promise<AuthPayload> {
    return authPayloadSchema.parse(await requestJson({
      url: resolveUrl('auth/refresh', this.configuredBaseUrl),
      method: 'POST',
      json: { refreshToken },
    }));
  }

  async logout(refreshToken: string): Promise<void> {
    await requestJson({
      url: resolveUrl('auth/logout', this.configuredBaseUrl),
      method: 'POST',
      json: { refreshToken },
    });
  }

  send(request: AuthenticatedRequest): Promise<unknown> {
    return requestJson({
      url: resolveUrl(request.path, this.configuredBaseUrl),
      method: request.method,
      accessToken: request.accessToken,
      ...(request.json === undefined ? {} : { json: request.json }),
      ...(request.signal === undefined ? {} : { signal: request.signal }),
    });
  }
}
