import { describe, expect, it, vi } from 'vitest';
import type { AuthCredentials, AuthMode, AuthPayload } from '@/src/auth/contracts';
import { ApiClientError, SessionStorageError, StaleSessionError } from '@/src/auth/errors';
import { AuthSession, type RefreshTokenStorage } from '@/src/auth/session';
import type { SessionTransport } from '@/src/auth/transport';

const credentials = { email: 'rider@example.com', password: 'password-1234' };

function authPayload(accessToken: string, refreshCharacter: string): AuthPayload {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken: refreshCharacter.repeat(43),
    refreshExpiresAt: '2030-02-01T00:00:00.000Z',
    sessionExpiresAt: '2030-04-01T00:00:00.000Z',
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'rider@example.com', createdAt: '2030-01-01T00:00:00.000Z' },
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

class MemoryTokenStorage implements RefreshTokenStorage {
  token: string | null = null;
  failReads = false;

  async get() {
    if (this.failReads) throw new Error('Storage unavailable');
    return this.token;
  }
  async set(token: string) { this.token = token; }
  async clear() { this.token = null; }
}

function transportWith(initial: AuthPayload, refreshed: () => Promise<AuthPayload>) {
  return {
    authenticate: vi.fn(async (_mode: AuthMode, _credentials: AuthCredentials) => initial),
    refresh: vi.fn(refreshed),
    logout: vi.fn(async (_refreshToken: string) => undefined),
    send: vi.fn(async (_request: Parameters<SessionTransport['send']>[0]): Promise<unknown> => ({ ok: true })),
  } satisfies SessionTransport;
}

describe('AuthSession', () => {
  it('shares one refresh while restoring a secure session', async () => {
    const givenRefresh = deferred<AuthPayload>();
    const givenRefreshStarted = deferred<void>();
    const transport = transportWith(authPayload('unused', 'a'), async () => {
      givenRefreshStarted.resolve();
      return givenRefresh.promise;
    });
    const storage = new MemoryTokenStorage();
    storage.token = 'a'.repeat(43);
    const session = new AuthSession(transport, storage);

    const whenFirst = session.initialize(true);
    const whenSecond = session.initialize(true);
    await givenRefreshStarted.promise;
    expect(transport.refresh).toHaveBeenCalledTimes(1);
    givenRefresh.resolve(authPayload('access-restored', 'b'));
    await Promise.all([whenFirst, whenSecond]);

    expect(session.getSnapshot().status).toBe('signed-in');
    expect(storage.token).toBe('b'.repeat(43));
  });

  it('shares one refresh when concurrent requests receive 401', async () => {
    const givenInitial = authPayload('access-old', 'a');
    const givenRotated = authPayload('access-new', 'b');
    const givenRefresh = deferred<AuthPayload>();
    const givenRefreshStarted = deferred<void>();
    let refreshCompleted = false;
    const transport = transportWith(givenInitial, async () => {
      givenRefreshStarted.resolve();
      const payload = await givenRefresh.promise;
      refreshCompleted = true;
      return payload;
    });
    transport.send.mockImplementation(async () => {
      if (!refreshCompleted) throw new ApiClientError('http', 'Unauthorized', 401);
      return { ok: true };
    });
    const storage = new MemoryTokenStorage();
    const session = new AuthSession(transport, storage);
    await session.login(credentials);

    const whenFirst = session.request({ path: 'motorcycles', method: 'GET' });
    const whenSecond = session.request({ path: 'motorcycles', method: 'GET' });
    await givenRefreshStarted.promise;
    expect(transport.refresh).toHaveBeenCalledTimes(1);
    givenRefresh.resolve(givenRotated);
    const results = await Promise.all([whenFirst, whenSecond]);

    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(transport.send).toHaveBeenCalledTimes(4);
    expect(storage.token).toBe(givenRotated.refreshToken);
  });

  it('discards a rotated token when logout wins the refresh race', async () => {
    const givenInitial = authPayload('access-old', 'a');
    const givenRotated = authPayload('access-new', 'b');
    const givenRefresh = deferred<AuthPayload>();
    const givenRefreshStarted = deferred<void>();
    const transport = transportWith(givenInitial, async () => {
      givenRefreshStarted.resolve();
      return givenRefresh.promise;
    });
    transport.send.mockRejectedValue(new ApiClientError('http', 'Unauthorized', 401));
    const storage = new MemoryTokenStorage();
    const session = new AuthSession(transport, storage);
    await session.login(credentials);

    const whenRequest = session.request({ path: 'motorcycles', method: 'GET' });
    const thenRejected = expect(whenRequest).rejects.toBeInstanceOf(StaleSessionError);
    await givenRefreshStarted.promise;
    await session.logout();
    givenRefresh.resolve(givenRotated);
    await thenRejected;

    expect(storage.token).toBeNull();
    expect(session.getSnapshot().status).toBe('signed-out');
  });

  it('discards a successful response that arrives after logout', async () => {
    const givenResponse = deferred<unknown>();
    const givenRequestStarted = deferred<void>();
    const transport = transportWith(authPayload('access-old', 'a'), async () => authPayload('access-new', 'b'));
    transport.send.mockImplementation(async () => {
      givenRequestStarted.resolve();
      return givenResponse.promise;
    });
    const session = new AuthSession(transport, new MemoryTokenStorage());
    await session.login(credentials);

    const whenRequest = session.request({ path: 'motorcycles', method: 'GET' });
    const thenRejected = expect(whenRequest).rejects.toBeInstanceOf(StaleSessionError);
    await givenRequestStarted.promise;
    await session.logout();
    givenResponse.resolve([{ id: 'late' }]);
    await thenRejected;

    expect(session.getSnapshot().status).toBe('signed-out');
  });

  it('closes the session when secure storage fails during refresh', async () => {
    const transport = transportWith(authPayload('access-old', 'a'), async () => authPayload('access-new', 'b'));
    transport.send.mockRejectedValue(new ApiClientError('http', 'Unauthorized', 401));
    const storage = new MemoryTokenStorage();
    const session = new AuthSession(transport, storage);
    await session.login(credentials);
    storage.failReads = true;

    await expect(session.request({ path: 'motorcycles', method: 'GET' })).rejects.toBeInstanceOf(SessionStorageError);

    expect(session.getSnapshot().status).toBe('unavailable');
  });
});
