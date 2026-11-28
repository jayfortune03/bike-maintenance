import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import appConfig from '@/app.json';
import { requestNotificationPermission } from '@/src/services/notifications';

const sharedReportsChannelId = 'shared-reports';
const expoProjectId = appConfig.expo.extra.eas.projectId;

export type PushDeviceApi = {
  registerPushDevice(token: string): Promise<unknown>;
};

export async function registerRemotePushToken(
  api: PushDeviceApi,
  token: Notifications.DevicePushToken,
): Promise<void> {
  if (Platform.OS === 'web' || typeof token.data !== 'string') return;
  const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId, devicePushToken: token });
  await api.registerPushDevice(expoToken.data);
}

export async function registerRemotePushDevice(api: PushDeviceApi): Promise<'unsupported' | 'denied' | 'registered'> {
  if (Platform.OS === 'web') return 'unsupported';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(sharedReportsChannelId, {
      name: 'Laporan garasi bersama',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  if (!(await requestNotificationPermission())) return 'denied';
  await registerRemotePushToken(api, await Notifications.getDevicePushTokenAsync());
  return 'registered';
}
