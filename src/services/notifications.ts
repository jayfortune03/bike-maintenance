import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/src/domain/types';

const channelId = 'maintenance-reminders';

export async function notificationPermissionLabel(): Promise<string> {
  if (Platform.OS === 'web') return 'Tidak tersedia di web';
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ? 'Diizinkan' : permission.canAskAgain ? 'Belum diizinkan' : 'Diblokir di pengaturan perangkat';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  // Android 13 needs a notification channel before showing its permission prompt.
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channelId, { name: 'Pengingat perawatan', importance: Notifications.AndroidImportance.DEFAULT });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleReminder(reminder: Reminder): Promise<string | undefined> {
  if (!reminder.notificationEnabled || reminder.completed) return undefined;
  const date = new Date(reminder.scheduledAt);
  if (!Number.isFinite(date.getTime())) throw new Error('Tanggal pengingat tidak valid.');
  if (Platform.OS === 'web') throw new Error('Notifikasi lokal hanya tersedia di aplikasi Android/iOS.');
  const { DATE, DAILY, WEEKLY, MONTHLY, YEARLY } = Notifications.SchedulableTriggerInputTypes;
  const clock = { channelId, hour: date.getHours(), minute: date.getMinutes() };
  let trigger: Notifications.SchedulableNotificationTriggerInput;
  switch (reminder.repeat) {
    case 'none':
      if (date.getTime() <= Date.now()) throw new Error('Pilih waktu pengingat yang belum lewat.');
      trigger = { type: DATE, channelId, date };
      break;
    case 'daily': trigger = { type: DAILY, ...clock }; break;
    case 'weekly': trigger = { type: WEEKLY, ...clock, weekday: date.getDay() + 1 }; break;
    case 'monthly':
      if (date.getDate() > 28) throw new Error('Notifikasi bulanan mendukung tanggal 1-28 agar konsisten di setiap bulan.');
      trigger = { type: MONTHLY, ...clock, day: date.getDate() };
      break;
    case 'yearly':
      if (date.getMonth() === 1 && date.getDate() === 29) throw new Error('Pilih tanggal selain 29 Februari untuk notifikasi tahunan.');
      trigger = { type: YEARLY, ...clock, month: date.getMonth(), day: date.getDate() };
      break;
    default: throw new Error('Pengulangan custom belum didukung untuk notifikasi lokal.');
  }
  if (reminder.repeat !== 'none') {
    const next = await Notifications.getNextTriggerDateAsync(trigger);
    if (next === null) throw new Error('Perangkat tidak dapat menentukan jadwal berulang ini.');
    // Native repeating triggers have no start-date constraint. Never deliver before the chosen start.
    if (Math.floor(next / 60000) < Math.floor(date.getTime() / 60000)) throw new Error(`Notifikasi berulang harus dimulai pada jadwal terdekat (${new Date(next).toLocaleString('id-ID')}). Sesuaikan tanggal mulai atau gunakan pengingat sekali.`);
  }
  if (!(await requestNotificationPermission())) throw new Error('Izin notifikasi belum diberikan. Aktifkan melalui pengaturan perangkat.');
  return Notifications.scheduleNotificationAsync({
    identifier: `motorcare-${reminder.id}`,
    content: { title: reminder.title, body: reminder.description ?? 'Waktunya merawat motor Anda.', sound: 'default', data: { reminderId: reminder.id, motorcycleId: reminder.motorcycleId, maintenanceRuleId: reminder.maintenanceRuleId } },
    trigger,
  });
}

export async function cancelReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  if (Platform.OS === 'web') throw new Error('Buka aplikasi di perangkat asal untuk membatalkan notifikasi ini.');
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
