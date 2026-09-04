import type { Reminder } from '@/src/domain/types';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from './calendar';
import { cancelReminder, scheduleReminder } from './notifications';

export async function createReminderWithIntegrations(reminder: Reminder): Promise<{ reminder: Reminder; warning?: string }> {
  let result = reminder;
  let warning: string | undefined;
  try {
    result = { ...result, notificationId: await scheduleReminder(result) };
  } catch {
    warning = 'Notifikasi tidak dapat dijadwalkan, tetapi pengingat tetap tersimpan.';
  }
  if (reminder.calendarEnabled) {
    try {
      const event = await createCalendarEvent(result);
      if (event) result = { ...result, calendarId: event.calendarId, calendarEventId: event.eventId };
      else warning = 'Akses kalender tidak tersedia. Pengingat tetap tersimpan.';
    } catch {
      warning = 'Pengingat tersimpan, tetapi tidak dapat ditambahkan ke kalender.';
    }
  }
  return { reminder: result, warning };
}

export async function updateReminderWithIntegrations(reminder: Reminder, changes: Partial<Reminder>): Promise<Reminder> {
  const next = { ...reminder, ...changes, updatedAt: new Date().toISOString() };
  try {
    await cancelReminder(reminder.notificationId);
  } catch {
    // A stale native notification must not prevent local reminder editing.
  }
  let notificationId: string | undefined;
  try {
    notificationId = await scheduleReminder(next);
  } catch {
    notificationId = undefined;
  }
  const updated = { ...next, notificationId };
  if (updated.calendarEnabled) {
    try {
      if (updated.calendarEventId) await updateCalendarEvent(updated);
      else {
        const event = await createCalendarEvent(updated);
        if (event) return { ...updated, calendarId: event.calendarId, calendarEventId: event.eventId };
      }
    } catch {
      return { ...updated, calendarEnabled: false };
    }
  } else if (reminder.calendarEventId) {
    try { await deleteCalendarEvent(reminder.calendarId, reminder.calendarEventId); } catch { /* Keep the local change. */ }
    return { ...updated, calendarId: undefined, calendarEventId: undefined };
  }
  return updated;
}

export async function deleteReminderWithIntegrations(reminder: Reminder): Promise<void> {
  try { await cancelReminder(reminder.notificationId); } catch { /* The local reminder can still be deleted. */ }
  try { await deleteCalendarEvent(reminder.calendarId, reminder.calendarEventId); } catch { /* The local reminder can still be deleted. */ }
}
