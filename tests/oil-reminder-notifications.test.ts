import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { oilReminderPlan } from '../src/domain/oil-reminder';
import { notificationTarget } from '../src/domain/notification-target';
import { oilReminderNotificationId, reconcileOilReminder } from '../src/services/oil-reminder-notifications';
import type { MaintenanceRule, Motorcycle, OilReminderPreference } from '../src/domain/types';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
}));

const now = '2030-01-01T09:00:00.000Z';
const motorcycle = { id: 'm1', nickname: 'Motor Harian', currentOdometer: 1_200 } as Motorcycle;
const rule = {
  id: 'oil', motorcycleId: 'm1', type: 'engine-oil', title: 'Ganti oli mesin', enabled: true,
  intervalKm: 1_000, lastCompletedKm: 1_000, intervalDays: 30, lastCompletedAt: now,
} as MaintenanceRule;
const enabled: OilReminderPreference = { enabled: true };
const permission = { granted: true, canAskAgain: true, status: 'granted', expires: 'never' };

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(Platform, { OS: 'android' });
  vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission as never);
  vi.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([]);
  vi.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue(oilReminderNotificationId(rule.id));
});

describe('oil reminder lifecycle', () => {
  it('schedules a deterministic native date notification and deduplicates against the OS list', async () => {
    const first = await reconcileOilReminder({ rule, motorcycle, preference: enabled, currentDate: now });
    const request = vi.mocked(Notifications.scheduleNotificationAsync).mock.lastCall?.[0];
    expect(request).toMatchObject({
      identifier: 'motorcare-oil-oil',
      content: { data: { oilRuleId: 'oil', motorcycleId: 'm1', oilCycle: first.cycle } },
      trigger: { type: 'date', channelId: 'maintenance-reminders' },
    });
    vi.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([request] as never);
    vi.mocked(Notifications.scheduleNotificationAsync).mockClear();
    expect(await reconcileOilReminder({ rule, motorcycle, preference: first, currentDate: now })).toEqual(first);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('alerts once when a recorded odometer reaches due mileage', async () => {
    const dueMotorcycle = { ...motorcycle, currentOdometer: 2_000 };
    const first = await reconcileOilReminder({ rule, motorcycle: dueMotorcycle, preference: enabled, currentDate: now });
    expect(vi.mocked(Notifications.scheduleNotificationAsync).mock.lastCall?.[0].trigger).toBeNull();
    expect(first).toMatchObject({ delivery: 'distance', enabled: true });
    vi.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await reconcileOilReminder({ rule, motorcycle: dueMotorcycle, preference: first, currentDate: now });
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('cancels and reschedules after a service baseline or interval changes', async () => {
    const oldPlan = oilReminderPlan(rule, motorcycle, now);
    const existing = { identifier: oilReminderNotificationId(rule.id), content: { data: { oilCycle: oldPlan?.cycle } } };
    vi.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([existing] as never);
    const changed = { ...rule, intervalDays: 60, lastCompletedAt: '2030-01-02T09:00:00.000Z' };
    const result = await reconcileOilReminder({ rule: changed, motorcycle, preference: { enabled: true, cycle: oldPlan?.cycle, delivery: 'time' }, currentDate: now });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('motorcare-oil-oil');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledOnce();
    expect(result.cycle).not.toBe(oldPlan?.cycle);
  });

  it('cleans disabled rules and reports permission denial without prompting', async () => {
    vi.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([{ identifier: oilReminderNotificationId(rule.id) }] as never);
    await reconcileOilReminder({ rule: { ...rule, enabled: false }, motorcycle, preference: enabled, currentDate: now });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('motorcare-oil-oil');
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...permission, granted: false, canAskAgain: false } as never);
    const result = await reconcileOilReminder({ rule, motorcycle, preference: enabled, currentDate: now });
    expect(result.error).toContain('diblokir');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('reads current state only when a queued reconciliation starts', async () => {
    let releaseSchedule: () => void = () => { throw new Error('Schedule gate not initialized'); };
    let announceSchedule: () => void = () => { throw new Error('Start gate not initialized'); };
    const gate = new Promise<void>((resolve) => { releaseSchedule = resolve; });
    const started = new Promise<void>((resolve) => { announceSchedule = resolve; });
    vi.mocked(Notifications.scheduleNotificationAsync).mockImplementationOnce(async () => {
      announceSchedule();
      await gate;
      vi.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([{ identifier: oilReminderNotificationId(rule.id) }] as never);
      return oilReminderNotificationId(rule.id);
    });
    const scheduling = reconcileOilReminder({ rule, motorcycle, preference: enabled, currentDate: now });
    await started;
    let current = { rule, motorcycle, preference: enabled, currentDate: now };
    const queued = reconcileOilReminder({ ruleId: rule.id, current: () => current, commit: () => undefined });
    current = undefined as never;
    releaseSchedule();
    await scheduling;
    expect(await queued).toBeUndefined();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(oilReminderNotificationId(rule.id));
  });
});

it('accepts only the current opted-in oil cycle when a notification is tapped', () => {
  const plan = oilReminderPlan(rule, motorcycle, now);
  const state = {
    reminders: [], motorcycles: [motorcycle], maintenanceRules: [rule],
    preferences: { oilReminders: { oil: enabled } },
  };
  expect(notificationTarget({ oilRuleId: 'oil', oilCycle: plan?.cycle }, state)).toEqual({ motorcycleId: 'm1', ruleId: 'oil', reminderId: undefined });
  expect(notificationTarget({ oilRuleId: 'oil', oilCycle: 'stale' }, state)).toBeNull();
  expect(notificationTarget({ oilRuleId: 'oil', oilCycle: plan?.cycle }, { ...state, preferences: { oilReminders: {} } })).toBeNull();
});
