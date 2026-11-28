import { useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { AppState, Platform } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationTarget } from '@/src/domain/notification-target';
import { authorizeSharedNotification, parseSharedNotification, type SharedNotificationTarget } from '@/src/domain/shared-notification';
import { useAppStore } from '@/src/store/app.store';
import { reconcileOilReminder } from '@/src/services/oil-reminder-notifications';
import { useAuthSnapshot } from '@/src/auth/AuthProvider';
import { ApiClientError, SessionExpiredError, StaleSessionError } from '@/src/auth/errors';
import { accountApi, authSession } from '@/src/auth/runtime';

export function NotificationObserver() {
  const router = useRouter();
  const root = useRootNavigationState();
  const session = useAuthSnapshot();
  const handled = useRef<string | null>(null);
  const [pendingShared, setPendingShared] = useState<SharedNotificationTarget>();
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
        void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
        return;
      }
      const shared = parseSharedNotification(response.notification.request.content.data);
      if (shared) setPendingShared(shared);
      else void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };
    const listener = Notifications.addNotificationResponseReceivedListener(respond);
    void Notifications.getLastNotificationResponseAsync().then(respond).catch(() => undefined);
    return () => { active = false; listener.remove(); Notifications.setNotificationHandler(null); };
  }, [root?.key, router]);
  useEffect(() => {
    if (!pendingShared || !root?.key) return;
    if (session.status === 'signed-out' || session.status === 'unavailable') {
      router.push({ pathname: '/account', params: { notification: 'shared-login' } });
      return;
    }
    if (session.status !== 'signed-in') return;
    const accountId = session.user.id;
    let active = true;
    const authorize = async () => {
      try {
        const motorcycles = await accountApi.listMotorcycles();
        if (!active || authSession.accountId !== accountId) return;
        const target = authorizeSharedNotification(pendingShared, motorcycles);
        setPendingShared(undefined);
        await Notifications.clearLastNotificationResponseAsync();
        if (target) router.push({ pathname: '/shared/[id]', params: { id: target.motorcycleId, reportId: target.reportId } });
        else router.replace({ pathname: '/account', params: { notification: 'unauthorized' } });
      } catch (error) {
        if (!active || error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
        if (error instanceof ApiClientError || error instanceof z.ZodError) router.push({ pathname: '/account', params: { notification: 'retry' } });
        else throw error;
      }
    };
    void authorize();
    return () => { active = false; };
  }, [pendingShared, refreshToken, root?.key, router, session]);
  return null;
}
