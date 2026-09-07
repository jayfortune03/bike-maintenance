import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { scheduleReminder, requestNotificationPermission } from '../src/services/notifications';
import { createCalendarEvent, deleteCalendarEvent } from '../src/services/calendar';
import { createReminderWithIntegrations, updateReminderWithIntegrations, deleteReminderWithIntegrations } from '../src/services/reminder-coordinator';
import { notificationTarget } from '../src/domain/notification-target';
import type { Reminder, Motorcycle, MaintenanceRule } from '../src/domain/types';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', YEARLY: 'yearly' },
  getPermissionsAsync: vi.fn(), requestPermissionsAsync: vi.fn(), setNotificationChannelAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(), cancelScheduledNotificationAsync: vi.fn(), getNextTriggerDateAsync: vi.fn(),
}));
vi.mock('expo-calendar', () => ({
  EntityTypes: { EVENT: 'event' }, getCalendarPermissionsAsync: vi.fn(), requestCalendarPermissionsAsync: vi.fn(), getCalendarsAsync: vi.fn(),
  createEventAsync: vi.fn(), updateEventAsync: vi.fn(), deleteEventAsync: vi.fn(), getEventAsync: vi.fn(),
}));

const at = new Date(2030, 0, 1, 9).toISOString();
const reminder: Reminder = { id: 'r1', motorcycleId: 'm1', maintenanceRuleId: 'oil', title: 'Cek motor', scheduledAt: at, repeat: 'none', notificationEnabled: true, calendarEnabled: true, completed: false, createdAt: at, updatedAt: at };
const permission = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2030, 0, 1, 8));
  Object.assign(Platform, { OS: 'android' });
  vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission as never);
  vi.mocked(Notifications.getNextTriggerDateAsync).mockResolvedValue(new Date(at).getTime());
  vi.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('motorcare-r1');
  vi.mocked(Calendar.getCalendarPermissionsAsync).mockResolvedValue(permission as never);
  vi.mocked(Calendar.getCalendarsAsync).mockResolvedValue([{ id: 'read-only', allowsModifications: false }, { id: 'calendar1', allowsModifications: true }] as never);
  vi.mocked(Calendar.createEventAsync).mockResolvedValue('event1');
  vi.mocked(Calendar.getEventAsync).mockResolvedValue({ id: 'event1' } as never);
});
afterEach(() => vi.useRealTimers());

describe('native reminder scheduling', () => {
  it('uses local clock/calendar components for each supported recurrence', async () => {
    for (const repeat of ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const) {
      await scheduleReminder({ ...reminder, repeat });
      const request = vi.mocked(Notifications.scheduleNotificationAsync).mock.lastCall![0];
      expect(request.identifier).toBe('motorcare-r1');
      if (repeat === 'none') expect(request.trigger).toEqual({ type: 'date', channelId: 'maintenance-reminders', date: new Date(at) });
      else expect(request.trigger).toMatchObject({ type: repeat, hour: 9, minute: 0, channelId: 'maintenance-reminders' });
      if (repeat === 'weekly') expect(request.trigger).toMatchObject({ weekday: new Date(at).getDay() + 1 });
      if (repeat === 'yearly') expect(request.trigger).toMatchObject({ month: 0, day: 1 });
    }
    expect(vi.mocked(Notifications.setNotificationChannelAsync)).toHaveBeenCalledBefore(vi.mocked(Notifications.getPermissionsAsync));
  });
  it('never schedules recurring notifications before the requested start', async () => {
    await expect(scheduleReminder({ ...reminder, repeat: 'daily', scheduledAt: new Date(2030, 0, 5, 9).toISOString() })).rejects.toThrow('jadwal terdekat');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('rejects invalid, elapsed, unavailable and ambiguous recurrence settings', async () => {
    await expect(scheduleReminder({ ...reminder, scheduledAt: '' })).rejects.toThrow('tidak valid');
    await expect(scheduleReminder({ ...reminder, scheduledAt: new Date(2020, 0, 1).toISOString() })).rejects.toThrow('belum lewat');
    await expect(scheduleReminder({ ...reminder, repeat: 'monthly', scheduledAt: new Date(2030, 0, 31, 9).toISOString() })).rejects.toThrow('1-28');
    await expect(scheduleReminder({ ...reminder, repeat: 'custom' })).rejects.toThrow('custom');
    Object.assign(Platform, { OS: 'web' });
    await expect(scheduleReminder(reminder)).rejects.toThrow('Android/iOS');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('does not re-prompt permanently denied permission', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...permission, granted: false, canAskAgain: false } as never);
    expect(await requestNotificationPermission()).toBe(false);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('integration lifecycle', () => {
  it('stores successful IDs and accurate enabled flags', async () => {
    const result = await createReminderWithIntegrations(reminder);
    expect(result.reminder).toMatchObject({ notificationId: 'motorcare-r1', calendarEventId: 'event1', calendarId: 'calendar1', notificationEnabled: true, calendarEnabled: true });
    expect(result.warning).toBeUndefined();
  });
  it('preserves local reminder and reports both failures, including permission denial', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...permission, granted: false, canAskAgain: false } as never);
    vi.mocked(Calendar.createEventAsync).mockRejectedValue(new Error('Kalender penuh'));
    const result = await createReminderWithIntegrations(reminder);
    expect(result.reminder).toMatchObject({ id: 'r1', notificationEnabled: false, calendarEnabled: false });
    expect(result.warning).toContain('Izin notifikasi');
    expect(result.warning).toContain('Kalender penuh');
  });
  it('keeps surviving resource IDs when update/cancel fails instead of orphaning them', async () => {
    vi.mocked(Notifications.cancelScheduledNotificationAsync).mockRejectedValue(new Error('Cancel failed'));
    vi.mocked(Calendar.updateEventAsync).mockRejectedValue(new Error('Update failed'));
    const result = await updateReminderWithIntegrations({ ...reminder, notificationId: 'legacy-id', calendarId: 'cal', calendarEventId: 'old-event' }, { title: 'Changed' });
    expect(result).toMatchObject({ notificationId: 'legacy-id', calendarEventId: 'old-event', notificationEnabled: true, calendarEnabled: true });
    expect(result.integrationWarning).toContain('Cancel failed');
    expect(result.integrationWarning).toContain('Update failed');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('removes a recurring calendar series and clears IDs when integrations are disabled', async () => {
    const result = await updateReminderWithIntegrations({ ...reminder, notificationId: 'old', calendarId: 'cal', calendarEventId: 'event1' }, { notificationEnabled: false, calendarEnabled: false });
    expect(Calendar.deleteEventAsync).toHaveBeenCalledWith('event1', { futureEvents: true });
    expect(result.notificationId).toBeUndefined();
    expect(result.calendarEventId).toBeUndefined();
    expect(result.integrationWarning).toBeUndefined();
  });
  it('propagates cleanup failure so callers retain local records for retry', async () => {
    vi.mocked(Calendar.deleteEventAsync).mockRejectedValue(new Error('Calendar unavailable'));
    await expect(deleteReminderWithIntegrations({ ...reminder, notificationId: 'old', calendarId: 'cal', calendarEventId: 'event1' })).rejects.toThrow('Calendar unavailable');
    for (const code of ['E_EVENT_NOT_FOUND', 'ERR_EVENT_NOT_FOUND']) {
      vi.mocked(Calendar.getEventAsync).mockRejectedValue({ code });
      await expect(deleteCalendarEvent('cal', 'already-deleted')).resolves.toBeUndefined();
    }
  });
  it('writes recurrence in the device timezone and never picks a read-only calendar', async () => {
    await createCalendarEvent({ ...reminder, repeat: 'monthly' });
    expect(Calendar.createEventAsync).toHaveBeenCalledWith('calendar1', expect.objectContaining({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, recurrenceRule: { frequency: 'monthly', interval: 1 }, startDate: new Date(at) }));
    vi.mocked(Calendar.getCalendarsAsync).mockResolvedValue([{ id: 'readonly', allowsModifications: false }] as never);
    await expect(createCalendarEvent(reminder)).rejects.toThrow('dapat ditulis');
  });
});

it('notification taps trust stored relationships, ignore deleted reminders and reject malformed IDs', () => {
  const state = { reminders: [reminder], motorcycles: [{ id: 'm1' }] as Motorcycle[], maintenanceRules: [{ id: 'oil', motorcycleId: 'm1' }] as MaintenanceRule[] };
  expect(notificationTarget({ reminderId: 'r1', motorcycleId: 'malicious' }, state)).toEqual({ motorcycleId: 'm1', reminderId: 'r1', ruleId: 'oil' });
  expect(notificationTarget({ reminderId: 'deleted' }, state)).toBeNull();
  expect(notificationTarget({ reminderId: { url: '/settings' } }, state)).toBeNull();
  expect(notificationTarget({ reminderId: 'r1' }, { ...state, maintenanceRules: [] })?.reminderId).toBe('r1');
});
