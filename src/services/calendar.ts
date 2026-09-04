import * as Calendar from 'expo-calendar';
import type { Reminder } from '@/src/domain/types';

export async function requestCalendarPermission(): Promise<boolean> {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  return permission.granted;
}

export async function createCalendarEvent(reminder: Reminder): Promise<{ calendarId: string; eventId: string } | undefined> {
  if (!(await requestCalendarPermission())) return undefined;
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const calendar = calendars.find((item) => item.allowsModifications) ?? calendars[0];
  if (!calendar) return undefined;
  const startDate = new Date(reminder.scheduledAt);
  const eventId = await Calendar.createEventAsync(calendar.id, { title: `Motor Care - ${reminder.title}`, notes: reminder.description, startDate, endDate: new Date(startDate.getTime() + 60 * 60 * 1000), timeZone: 'Asia/Jakarta' });
  return { calendarId: calendar.id, eventId };
}

export async function deleteCalendarEvent(calendarId?: string, eventId?: string): Promise<void> {
  if (calendarId && eventId) await Calendar.deleteEventAsync(eventId);
}

export async function updateCalendarEvent(reminder: Reminder): Promise<void> {
  if (!reminder.calendarEventId) return;
  const startDate = new Date(reminder.scheduledAt);
  await Calendar.updateEventAsync(reminder.calendarEventId, { title: `Motor Care - ${reminder.title}`, notes: reminder.description, startDate, endDate: new Date(startDate.getTime() + 60 * 60 * 1000), timeZone: 'Asia/Jakarta' });
}
