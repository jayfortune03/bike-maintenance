import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationTarget } from '@/src/domain/notification-target';
import { useAppStore } from '@/src/store/app.store';
import { reconcileOilReminder } from '@/src/services/oil-reminder-notifications';

export function NotificationObserver() {
  const router = useRouter();
  const root = useRootNavigationState();
  const handled = useRef<string | null>(null);
  const motorcycles = useAppStore((state) => state.motorcycles);
  const maintenanceRules = useAppStore((state) => state.maintenanceRules);
  const oilReminders = useAppStore((state) => state.preferences.oilReminders);
  const updateOilReminderPreference = useAppStore((state) => state.updateOilReminderPreference);
  const [refreshToken, setRefreshToken] = useState(0);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') setRefreshToken((value) => value + 1);
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    const reconcile = async () => {
      for (const ruleId of Object.keys(oilReminders)) {
        if (!active) return;
        try {
          await reconcileOilReminder({
            ruleId,
            current: () => {
              const state = useAppStore.getState();
              const preference = state.preferences.oilReminders[ruleId];
              const rule = state.maintenanceRules.find((item) => item.id === ruleId);
              const motorcycle = rule && state.motorcycles.find((item) => item.id === rule.motorcycleId);
              return preference && rule && motorcycle ? { rule, motorcycle, preference } : undefined;
            },
            commit: (preference) => {
              const current = useAppStore.getState().preferences.oilReminders[ruleId];
              if (preference && current?.enabled) updateOilReminderPreference(ruleId, preference);
              else if (!preference && current) updateOilReminderPreference(ruleId);
            },
          });
          if (!active) return;
        } catch (error) {
          const current = useAppStore.getState().preferences.oilReminders[ruleId];
          if (active && current) updateOilReminderPreference(ruleId, { ...current, error: error instanceof Error ? error.message : 'Notifikasi oli tidak dapat diperbarui.' });
        }
      }
    };
    void reconcile().catch((error) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : 'Notifikasi oli tidak dapat diperbarui.';
      const state = useAppStore.getState();
      for (const [ruleId, preference] of Object.entries(state.preferences.oilReminders)) {
        updateOilReminderPreference(ruleId, { ...preference, error: message });
      }
    });
    return () => { active = false; };
  }, [maintenanceRules, motorcycles, oilReminders, refreshToken, updateOilReminderPreference]);
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
