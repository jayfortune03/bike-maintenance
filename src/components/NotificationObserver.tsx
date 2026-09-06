import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationTarget } from '@/src/domain/notification-target';
import { useAppStore } from '@/src/store/app.store';

export function NotificationObserver() {
  const router = useRouter();
  const root = useRootNavigationState();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' || !root?.key) return;
    let active = true;
    Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
    const respond = (response: Notifications.NotificationResponse | null) => {
      if (!active || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = `${response.notification.request.identifier}:${response.notification.date}`;
      if (handled.current === id) return;
      handled.current = id;
      const state = useAppStore.getState();
      const target = notificationTarget(response.notification.request.content.data, state);
      if (target) {
        if (target.motorcycleId) state.setActiveMotorcycle(target.motorcycleId);
        if (target.ruleId) router.push({ pathname: '/maintenance/[id]', params: { id: target.ruleId } });
        else router.push({ pathname: '/reminder/edit', params: { id: target.reminderId } });
      }
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };
    const listener = Notifications.addNotificationResponseReceivedListener(respond);
    void Notifications.getLastNotificationResponseAsync().then(respond).catch(() => undefined);
    return () => { active = false; listener.remove(); Notifications.setNotificationHandler(null); };
  }, [root?.key, router]);
  return null;
}
