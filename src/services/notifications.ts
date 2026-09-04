import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/src/domain/types';

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function scheduleReminder(reminder: Reminder): Promise<string | undefined> {
  if (!reminder.notificationEnabled) return undefined;
  const granted = await requestNotificationPermission();
  if (!granted) return undefined;
  await Notifications.setNotificationChannelAsync('maintenance-reminders', { name: 'Pengingat perawatan', importance: Notifications.AndroidImportance.DEFAULT });
  const trigger: Notifications.NotificationTriggerInput = reminder.repeat === 'none'
    ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.scheduledAt) }
    : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: reminder.repeat === 'daily' ? 86400 : reminder.repeat === 'weekly' ? 604800 : 2592000, repeats: true };
  return Notifications.scheduleNotificationAsync({ content: { title: reminder.title, body: reminder.description ?? 'Waktunya merawat motor Anda.', data: { reminderId: reminder.id, motorcycleId: reminder.motorcycleId, maintenanceRuleId: reminder.maintenanceRuleId } }, trigger });
}

export async function cancelReminder(notificationId?: string): Promise<void> {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}
