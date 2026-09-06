import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import type { Reminder } from '@/src/domain/types';

export async function requestCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Calendar.requestCalendarPermissionsAsync()).granted;
}

function eventDetails(reminder: Reminder) {
  const startDate = new Date(reminder.scheduledAt);
  if (!Number.isFinite(startDate.getTime())) throw new Error('Tanggal kalender tidak valid.');
  if (reminder.repeat === 'custom' && (!Number.isSafeInteger(reminder.repeatInterval) || reminder.repeatInterval! < 1)) throw new Error('Interval kalender custom tidak valid.');
  return {
    title: `Motor Care - ${reminder.title}`,
    notes: reminder.description ?? '',
    startDate,
    endDate: new Date(startDate.getTime() + 60 * 60 * 1000),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurrenceRule: reminder.repeat === 'none' ? null : { frequency: (reminder.repeat === 'custom' ? 'daily' : reminder.repeat) as Calendar.Frequency, interval: reminder.repeat === 'custom' ? reminder.repeatInterval : 1 },
  };
}

export async function createCalendarEvent(reminder: Reminder): Promise<{ calendarId: string; eventId: string }> {
  const details = eventDetails(reminder);
  if (!(await requestCalendarPermission())) throw new Error('Akses kalender tidak tersedia. Aktifkan izin di aplikasi Android/iOS.');
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const calendar = calendars.find((item) => item.allowsModifications && item.isPrimary) ?? calendars.find((item) => item.allowsModifications);
  if (!calendar) throw new Error('Tidak ada kalender yang dapat ditulis di perangkat ini.');
  const eventId = await Calendar.createEventAsync(calendar.id, details);
  return { calendarId: calendar.id, eventId };
}

export async function deleteCalendarEvent(_calendarId?: string, eventId?: string): Promise<void> {
  if (!eventId) return;
  if (!(await requestCalendarPermission())) throw new Error('Izin kalender diperlukan untuk menghapus acara terkait.');
  try {
    const event = await Calendar.getEventAsync(eventId);
    if (event) await Calendar.deleteEventAsync(eventId, { futureEvents: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && ['E_EVENT_NOT_FOUND', 'ERR_EVENT_NOT_FOUND'].includes(String(error.code))) return;
    throw error;
  }
}

export async function updateCalendarEvent(reminder: Reminder): Promise<void> {
  if (!reminder.calendarEventId) throw new Error('Acara kalender tidak ditemukan.');
  if (!(await requestCalendarPermission())) throw new Error('Izin kalender diperlukan untuk memperbarui acara.');
  await Calendar.updateEventAsync(reminder.calendarEventId, eventDetails(reminder), { futureEvents: true });
}
