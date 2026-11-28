import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useAuthSnapshot } from '@/src/auth/AuthProvider';
import { accountApi, authSession } from '@/src/auth/runtime';
import { registerRemotePushDevice, registerRemotePushToken } from '@/src/services/remote-push';

export function RemotePushRegistration() {
  const session = useAuthSnapshot();
  const [failedAccountId, setFailedAccountId] = useState<string>();

  useEffect(() => {
    if (session.status !== 'signed-in' || Platform.OS === 'web') {
      return;
    }
    const accountId = session.user.id;
    let active = true;
    const reportFailure = (error: unknown) => {
      if (!active || authSession.accountId !== accountId) return;
      if (error instanceof Error) setFailedAccountId(accountId);
      else throw error;
    };
    const register = () => registerRemotePushDevice(accountApi).then(() => {
      if (active && authSession.accountId === accountId) setFailedAccountId(undefined);
    }).catch(reportFailure);
    void register();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authSession.accountId === accountId) void register();
    });
    const subscription = Notifications.addPushTokenListener((token) => {
      if (authSession.accountId === accountId) void registerRemotePushToken(accountApi, token).catch(reportFailure);
    });
    return () => { active = false; appStateSubscription.remove(); subscription.remove(); };
  }, [session]);

  const warningVisible = session.status === 'signed-in' && failedAccountId === session.user.id;
  return <Snackbar visible={warningVisible} onDismiss={() => setFailedAccountId(undefined)} duration={6000}>Notifikasi laporan bersama belum aktif. Periksa izin dan koneksi.</Snackbar>;
}
