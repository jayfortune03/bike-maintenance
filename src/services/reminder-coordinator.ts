import type { Reminder } from '@/src/domain/types';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from './calendar';
import { cancelReminder, scheduleReminder } from './notifications';

export async function createReminderWithIntegrations(reminder: Reminder): Promise<{ reminder: Reminder; warning?: string }> {
  const result = await updateReminderWithIntegrations({ ...reminder, notificationEnabled: false, calendarEnabled: false, notificationId: undefined, calendarId: undefined, calendarEventId: undefined }, reminder);
  return { reminder: result, warning: result.integrationWarning };
}

export async function updateReminderWithIntegrations(reminder: Reminder, changes: Partial<Reminder>): Promise<Reminder> {
  const next = { ...reminder, ...changes, updatedAt: new Date().toISOString() };
  if (!next.title.trim() || !Number.isFinite(new Date(next.scheduledAt).getTime())) throw new Error('Judul dan tanggal pengingat wajib valid.');
  const warnings: string[] = [];
  const result = { ...next, notificationId: reminder.notificationId, calendarId: reminder.calendarId, calendarEventId: reminder.calendarEventId };
  let cancelled = false;
  try {
    await cancelReminder(reminder.notificationId);
    cancelled = true;
    result.notificationId = undefined;
    result.notificationId = await scheduleReminder(next);
    result.notificationEnabled = !!result.notificationId;
  } catch (error) {
    result.notificationEnabled = !cancelled && !!reminder.notificationId;
    warnings.push(error instanceof Error ? error.message : 'Notifikasi tidak dapat diperbarui.');
  }
  try {
    if (next.calendarEnabled && !next.completed) {
      if (reminder.calendarEventId) await updateCalendarEvent(result);
      else {
        const event = await createCalendarEvent(next);
        result.calendarId = event.calendarId;
        result.calendarEventId = event.eventId;
      }
      result.calendarEnabled = true;
    } else {
      await deleteCalendarEvent(reminder.calendarId, reminder.calendarEventId);
      result.calendarId = undefined;
      result.calendarEventId = undefined;
      result.calendarEnabled = false;
    }
  } catch (error) {
    // Retain IDs of surviving external resources so a later retry can update or remove them.
    result.calendarEnabled = !!reminder.calendarEventId;
    warnings.push(error instanceof Error ? error.message : 'Kalender tidak dapat diperbarui.');
  }
  result.integrationWarning = warnings.length ? warnings.join(' ') : undefined;
  return result;
}

export async function deleteReminderWithIntegrations(reminder: Reminder): Promise<void> {
  // Do not erase local IDs if the OS could not clean up the linked resources.
  await cancelReminder(reminder.notificationId);
  await deleteCalendarEvent(reminder.calendarId, reminder.calendarEventId);
}

export async function deleteRemindersWithIntegrations(reminders: Reminder[]): Promise<void> {
  for (const reminder of reminders) await deleteReminderWithIntegrations(reminder);
}
