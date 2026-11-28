import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountApi } from '@/src/auth/account-api';
import type { AuthPayload } from '@/src/auth/contracts';
import { AuthSession } from '@/src/auth/session';
import { KySessionTransport } from '@/src/auth/transport';

const payload: AuthPayload = {
  accessToken: 'access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: 'a'.repeat(43),
  refreshExpiresAt: '2030-02-01T00:00:00.000Z',
  sessionExpiresAt: '2030-04-01T00:00:00.000Z',
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'rider@example.com',
    createdAt: '2030-01-01T00:00:00.000Z',
  },
};

afterEach(() => vi.unstubAllGlobals());

describe('account API transport', () => {
  it('uses the backend paths, bearer header, and exact account payloads', async () => {
    const requests: { readonly method: string; readonly path: string; readonly authorization: string | null; readonly body?: unknown }[] = [];
    const fetchMock = vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      const contentType = request.headers.get('content-type');
      requests.push({
        method: request.method,
        path,
        authorization: request.headers.get('Authorization'),
        ...(contentType?.includes('application/json') ? { body: await request.clone().json() } : {}),
      });
      if (path.endsWith('/auth/login')) return Response.json(payload);
      if (path.endsWith('/motorcycles/import')) {
        return Response.json({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, { status: 201 });
      }
      if (request.method === 'GET' && path.endsWith('/motorcycles')) return Response.json([]);
      if (request.method === 'GET' && path.endsWith('/invitations')) return Response.json([]);
      if (request.method === 'GET' && path.endsWith('/reports')) return Response.json([]);
      if (path.endsWith('/invitations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/accept')) {
        return Response.json({ motorcycleId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }, { status: 201 });
      }
      if (path.endsWith('/motorcycles/cccccccc-cccc-4ccc-8ccc-cccccccccccc/invitations')) {
        return Response.json({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }, { status: 201 });
      }
      if (path.endsWith('/motorcycles/cccccccc-cccc-4ccc-8ccc-cccccccccccc/reports')) {
        return Response.json({
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          createdAt: '2030-01-02T00:00:00.000Z',
          authorEmail: 'rider@example.com',
          odometerKm: 456,
          fuelBars: 4,
          note: 'Rantai bersih',
        }, { status: 201 });
      }
      if (path.endsWith('/push-devices')) {
        return Response.json({ token: 'ExponentPushToken[expo-token]' }, { status: 201 });
      }
      return new Response(undefined, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const storage = {
      get: async () => null,
      set: async (_token: string) => undefined,
      clear: async () => undefined,
    };
    const session = new AuthSession(new KySessionTransport('http://127.0.0.1:5051/api/v1'), storage);
    const api = new AccountApi(session);

    await session.login({ email: ' Rider@Example.com ', password: 'password-1234' });
    await api.importMotorcycle({ importKey: 'local-a', name: 'Motor A', odometerKm: 123 });
    await api.listMotorcycles();
    await api.listInvitations();
    const acceptedMotorcycleId = await api.acceptInvitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    const invitationId = await api.inviteMotorcycle('cccccccc-cccc-4ccc-8ccc-cccccccccccc', ' Member@Example.com ');
    await api.listReports('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    const report = await api.createReport('cccccccc-cccc-4ccc-8ccc-cccccccccccc', { odometerKm: 456, fuelBars: 4, note: 'Rantai bersih' });
    const pushToken = await api.registerPushDevice('ExponentPushToken[expo-token]');

    expect(acceptedMotorcycleId).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(invitationId).toBe('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    expect(report.id).toBe('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
    expect(pushToken).toBe('ExponentPushToken[expo-token]');

    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        authorization: null,
        body: { email: 'rider@example.com', password: 'password-1234' },
      },
      {
        method: 'POST',
        path: '/api/v1/motorcycles/import',
        authorization: 'Bearer access-token',
        body: { importKey: 'local-a', name: 'Motor A', odometerKm: 123 },
      },
      { method: 'GET', path: '/api/v1/motorcycles', authorization: 'Bearer access-token' },
      { method: 'GET', path: '/api/v1/invitations', authorization: 'Bearer access-token' },
      { method: 'POST', path: '/api/v1/invitations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/accept', authorization: 'Bearer access-token' },
      {
        method: 'POST',
        path: '/api/v1/motorcycles/cccccccc-cccc-4ccc-8ccc-cccccccccccc/invitations',
        authorization: 'Bearer access-token',
        body: { email: 'member@example.com' },
      },
      { method: 'GET', path: '/api/v1/motorcycles/cccccccc-cccc-4ccc-8ccc-cccccccccccc/reports', authorization: 'Bearer access-token' },
      {
        method: 'POST',
        path: '/api/v1/motorcycles/cccccccc-cccc-4ccc-8ccc-cccccccccccc/reports',
        authorization: 'Bearer access-token',
        body: { odometerKm: 456, fuelBars: 4, note: 'Rantai bersih' },
      },
      { method: 'POST', path: '/api/v1/push-devices', authorization: 'Bearer access-token', body: { token: 'ExponentPushToken[expo-token]' } },
    ]);
  });
});
