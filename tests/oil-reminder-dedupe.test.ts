import { beforeEach, expect, it, vi } from 'vitest';
import { cancelOilReminder, reconcileOilReminder } from '../src/services/oil-reminder-notifications';
import type { MaintenanceRule, Motorcycle, OilReminderPreference } from '../src/domain/types';

const native = vi.hoisted(() => ({
  schedule: vi.fn().mockResolvedValue('motorcare-oil-oil'),
  scheduled: vi.fn().mockResolvedValue([]),
  cancel: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  getAllScheduledNotificationsAsync: native.scheduled,
  scheduleNotificationAsync: native.schedule,
  cancelScheduledNotificationAsync: native.cancel,
}));

beforeEach(() => {
  native.schedule.mockClear();
  native.cancel.mockClear();
  native.scheduled.mockResolvedValue([]);
});

it('does not notify twice when time and distance become due in the same oil cycle', async () => {
  const rule: MaintenanceRule = {
    id: 'oil', motorcycleId: 'motor', type: 'engine-oil', title: 'Ganti oli',
    intervalDays: 30, intervalKm: 1000, lastCompletedKm: 1000,
    lastCompletedAt: '2030-01-01T09:00:00.000Z', enabled: true,
    sourceType: 'generic', createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const motorcycle: Motorcycle = {
    id: 'motor', nickname: 'Motor', brand: 'Honda', model: 'CBR', type: 'sport',
    themeColor: '#0F766E', currentOdometer: 1500,
    createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const currentDate = '2030-02-02T09:00:00.000Z';
  const preference = await reconcileOilReminder({ rule, motorcycle, preference: { enabled: true }, currentDate });
  expect(native.schedule).toHaveBeenCalledOnce();
  await reconcileOilReminder({ rule, motorcycle: { ...motorcycle, currentOdometer: 2000 }, preference, currentDate });
  expect(native.schedule).toHaveBeenCalledOnce();
});

it('does not leave a pending oil notification behind when cancellation races scheduling', async () => {
  const rule: MaintenanceRule = {
    id: 'oil', motorcycleId: 'motor', type: 'engine-oil', title: 'Ganti oli',
    intervalDays: 30, lastCompletedAt: '2030-01-01T09:00:00.000Z', enabled: true,
    sourceType: 'generic', createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const motorcycle: Motorcycle = {
    id: 'motor', nickname: 'Motor', brand: 'Honda', model: 'CBR', type: 'sport',
    themeColor: '#0F766E', currentOdometer: 1500,
    createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  let releaseSchedule: () => void = () => { throw new Error('Schedule gate not initialized'); };
  let announceSchedule: () => void = () => { throw new Error('Start gate not initialized'); };
  const gate = new Promise<void>((resolve) => { releaseSchedule = resolve; });
  const started = new Promise<void>((resolve) => { announceSchedule = resolve; });
  native.schedule.mockImplementationOnce(async () => {
    announceSchedule();
    await gate;
    native.scheduled.mockResolvedValue([{ identifier: 'motorcare-oil-oil' }]);
    return 'motorcare-oil-oil';
  });
  const scheduling = reconcileOilReminder({ rule, motorcycle, preference: { enabled: true }, currentDate: '2030-01-01T10:00:00.000Z' });
  await started;
  const cancelling = cancelOilReminder('oil');
  await Promise.resolve();
  releaseSchedule();
  await Promise.all([scheduling, cancelling]);
  expect(native.cancel).toHaveBeenCalledWith('motorcare-oil-oil');
});

it('does not restore a reminder preference while lifecycle cleanup waits for reconciliation', async () => {
  const rule: MaintenanceRule = {
    id: 'oil', motorcycleId: 'motor', type: 'engine-oil', title: 'Ganti oli',
    intervalDays: 30, lastCompletedAt: '2030-01-01T09:00:00.000Z', enabled: true,
    sourceType: 'generic', createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const motorcycle: Motorcycle = {
    id: 'motor', nickname: 'Motor', brand: 'Honda', model: 'CBR', type: 'sport',
    themeColor: '#0F766E', currentOdometer: 1500,
    createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  let preference: OilReminderPreference | undefined = { enabled: true };
  let commits = 0;
  let releaseSchedule: () => void = () => { throw new Error('Schedule gate not initialized'); };
  let announceSchedule: () => void = () => { throw new Error('Start gate not initialized'); };
  const gate = new Promise<void>((resolve) => { releaseSchedule = resolve; });
  const started = new Promise<void>((resolve) => { announceSchedule = resolve; });
  native.schedule.mockImplementationOnce(async () => {
    announceSchedule();
    await gate;
    native.scheduled.mockResolvedValue([{ identifier: 'motorcare-oil-oil' }]);
    return 'motorcare-oil-oil';
  });
  const reconciling = reconcileOilReminder({
    ruleId: rule.id,
    current: () => preference ? { rule, motorcycle, preference, currentDate: '2030-01-01T10:00:00.000Z' } : undefined,
    commit: (next) => {
      commits += 1;
      if (preference?.enabled && next) preference = next;
      else if (!next) preference = undefined;
    },
  });
  await started;
  preference = { enabled: false };
  const cancelling = cancelOilReminder(rule.id);
  releaseSchedule();
  await Promise.all([reconciling, cancelling]);
  expect(commits).toBe(1);
  expect(preference).toEqual({ enabled: false });
  expect(native.cancel).toHaveBeenCalledWith('motorcare-oil-oil');
});

it('does not notify again after the OS delivers a previously scheduled date reminder', async () => {
  const rule: MaintenanceRule = {
    id: 'oil', motorcycleId: 'motor', type: 'engine-oil', title: 'Ganti oli',
    intervalDays: 30, intervalKm: 1000, lastCompletedKm: 1000,
    lastCompletedAt: '2030-01-01T09:00:00.000Z', enabled: true,
    sourceType: 'generic', createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const motorcycle: Motorcycle = {
    id: 'motor', nickname: 'Motor', brand: 'Honda', model: 'CBR', type: 'sport',
    themeColor: '#0F766E', currentOdometer: 1500,
    createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const scheduled = await reconcileOilReminder({ rule, motorcycle, preference: { enabled: true }, currentDate: '2030-01-01T10:00:00.000Z' });
  const afterDelivery = await reconcileOilReminder({ rule, motorcycle, preference: scheduled, currentDate: '2030-02-02T09:00:00.000Z' });
  await reconcileOilReminder({ rule, motorcycle: { ...motorcycle, currentOdometer: 2000 }, preference: afterDelivery, currentDate: '2030-02-02T09:00:00.000Z' });
  expect(native.schedule).toHaveBeenCalledOnce();
});

it('does not notify again when time and distance are both due on the first reopen after OS delivery', async () => {
  const rule: MaintenanceRule = {
    id: 'oil', motorcycleId: 'motor', type: 'engine-oil', title: 'Ganti oli',
    intervalDays: 30, intervalKm: 1000, lastCompletedKm: 1000,
    lastCompletedAt: '2030-01-01T09:00:00.000Z', enabled: true,
    sourceType: 'generic', createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const motorcycle: Motorcycle = {
    id: 'motor', nickname: 'Motor', brand: 'Honda', model: 'CBR', type: 'sport',
    themeColor: '#0F766E', currentOdometer: 1500,
    createdAt: '2030-01-01', updatedAt: '2030-01-01',
  };
  const scheduled = await reconcileOilReminder({ rule, motorcycle, preference: { enabled: true }, currentDate: '2030-01-01T10:00:00.000Z' });
  await reconcileOilReminder({ rule, motorcycle: { ...motorcycle, currentOdometer: 2000 }, preference: scheduled, currentDate: '2030-02-02T09:00:00.000Z' });
  expect(native.schedule).toHaveBeenCalledOnce();
});
