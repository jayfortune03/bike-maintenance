import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Notifications from 'expo-notifications';
import { registerRemotePushDevice } from '@/src/services/remote-push';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getDevicePushTokenAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
}));

const permission = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission as never);
  vi.mocked(Notifications.getDevicePushTokenAsync).mockResolvedValue({ type: 'android', data: 'fcm-token' });
  vi.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ type: 'expo', data: 'ExponentPushToken[expo-token]' });
});

describe('remote push registration', () => {
  it('creates Android channels and exchanges the native token before binding the Expo token', async () => {
    const api = { registerPushDevice: vi.fn(async (_token: string) => undefined) };

    expect(await registerRemotePushDevice(api)).toBe('registered');

    expect(Notifications.setNotificationChannelAsync).toHaveBeenNthCalledWith(1, 'shared-reports', expect.objectContaining({ name: 'Laporan garasi bersama' }));
    expect(Notifications.setNotificationChannelAsync).toHaveBeenNthCalledWith(2, 'maintenance-reminders', expect.objectContaining({ name: 'Pengingat perawatan' }));
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: '99ecf4c9-2bfd-458f-803e-4496af56481e',
      devicePushToken: { type: 'android', data: 'fcm-token' },
    });
    expect(api.registerPushDevice).toHaveBeenCalledWith('ExponentPushToken[expo-token]');
    expect(vi.mocked(Notifications.getExpoPushTokenAsync).mock.invocationCallOrder[0]).toBeLessThan(api.registerPushDevice.mock.invocationCallOrder[0]);
  });

  it('does not request a token when notification permission is blocked', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...permission, granted: false, canAskAgain: false } as never);
    const api = { registerPushDevice: vi.fn(async (_token: string) => undefined) };

    expect(await registerRemotePushDevice(api)).toBe('denied');

    expect(Notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(api.registerPushDevice).not.toHaveBeenCalled();
  });
});
