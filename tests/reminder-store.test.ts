import { beforeEach, expect, it, vi } from 'vitest';
import { useAppStore } from '../src/store/app.store';
import { deleteRemindersWithIntegrations, updateReminderWithIntegrations } from '../src/services/reminder-coordinator';
import type { MaintenanceRule, Motorcycle, Reminder } from '../src/domain/types';
import { removeMotorcyclePhoto } from '../src/services/motorcycle-photo';
import { cancelOilReminder, cancelOilReminders } from '../src/services/oil-reminder-notifications';

vi.mock('../src/storage/adapter', () => ({ mmkvStorage: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('../src/services/reminder-coordinator', () => ({ deleteRemindersWithIntegrations: vi.fn(), updateReminderWithIntegrations: vi.fn() }));
vi.mock('../src/services/motorcycle-photo', () => ({ removeMotorcyclePhoto: vi.fn() }));
vi.mock('../src/services/oil-reminder-notifications', () => ({ cancelOilReminder: vi.fn(), cancelOilReminders: vi.fn() }));
const at = new Date(2030, 0, 1, 9).toISOString();
const motorcycle = { id: 'm1', currentOdometer: 1000, photoUri: 'file:///motorcycle-photos/m1.jpg' } as Motorcycle;
const rule = { id: 'oil', motorcycleId: 'm1', type: 'engine-oil', title: 'Oli', lastCompletedKm: 900, intervalDays: 30 } as MaintenanceRule;
const reminder = { id: 'r1', motorcycleId: 'm1', maintenanceRuleId: 'oil', repeat: 'none', scheduledAt: at } as Reminder;

beforeEach(() => {
  vi.resetAllMocks();
  useAppStore.setState({ motorcycles: [motorcycle], maintenanceRules: [rule], reminders: [reminder], maintenanceLogs: [], odometerLogs: [], activeMotorcycleId: 'm1', preferences: { themeMode: 'system', useMotorcycleAccent: true, oilReminders: {} } });
  vi.mocked(updateReminderWithIntegrations).mockImplementation(async (original, changes) => ({ ...original, ...changes }));
  vi.mocked(cancelOilReminder).mockResolvedValue(undefined);
  vi.mocked(cancelOilReminders).mockResolvedValue(undefined);
});

it('persists explicit oil opt-in and removes it only after native cancellation succeeds', async () => {
  await useAppStore.getState().setOilReminderEnabled('oil', true);
  expect(useAppStore.getState().preferences.oilReminders.oil).toEqual({ enabled: true });
  vi.mocked(cancelOilReminder).mockRejectedValueOnce(new Error('Native unavailable'));
  await expect(useAppStore.getState().setOilReminderEnabled('oil', false)).rejects.toThrow('Native unavailable');
  expect(useAppStore.getState().preferences.oilReminders.oil?.enabled).toBe(true);
  await useAppStore.getState().setOilReminderEnabled('oil', false);
  expect(useAppStore.getState().preferences.oilReminders.oil).toBeUndefined();
});

it('cleans resources before deleting a motorcycle or resetting data, retaining records on failure', async () => {
  vi.mocked(deleteRemindersWithIntegrations).mockRejectedValue(new Error('Offline calendar'));
  await expect(useAppStore.getState().deleteMotorcycle('m1')).rejects.toThrow();
  await expect(useAppStore.getState().resetData()).rejects.toThrow();
  expect(useAppStore.getState().reminders).toHaveLength(1);
  expect(useAppStore.getState().motorcycles).toHaveLength(1);
  vi.mocked(deleteRemindersWithIntegrations).mockResolvedValue(undefined);
  await useAppStore.getState().deleteMotorcycle('m1');
  expect(cancelOilReminders).toHaveBeenCalledWith(['oil']);
  expect(deleteRemindersWithIntegrations).toHaveBeenCalledWith([reminder]);
  expect(useAppStore.getState().reminders).toHaveLength(0);
  expect(removeMotorcyclePhoto).toHaveBeenCalledWith(motorcycle.photoUri);
});

it('removes a profile photo only when its URI changes', () => {
  useAppStore.getState().updateMotorcycle('m1', { nickname: 'Nama baru' });
  expect(removeMotorcyclePhoto).not.toHaveBeenCalled();

  useAppStore.getState().updateMotorcycle('m1', { photoUri: 'file:///motorcycle-photos/replacement.jpg' });
  expect(removeMotorcyclePhoto).toHaveBeenCalledWith(motorcycle.photoUri);
});

it('removes profile photos when all local data is reset', async () => {
  await useAppStore.getState().resetData();
  expect(removeMotorcyclePhoto).toHaveBeenCalledWith(motorcycle.photoUri);
  expect(useAppStore.getState().motorcycles).toHaveLength(0);
});

it('keeps mileage baseline when completion omits mileage and reschedules time-based one-shot reminders', async () => {
  await useAppStore.getState().completeMaintenance('oil', { completedAt: at });
  expect(useAppStore.getState().maintenanceRules[0].lastCompletedKm).toBe(900);
  expect(useAppStore.getState().maintenanceLogs).toHaveLength(1);
  expect(useAppStore.getState().reminders[0].scheduledAt).toBe(new Date(2030, 0, 31, 9).toISOString());
});

it('keeps the current odometer when logging historical service mileage', async () => {
  const today = new Date();
  const completedAt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9).toISOString();
  await useAppStore.getState().completeMaintenance('oil', { completedAt, odometer: 800 });

  expect(useAppStore.getState().motorcycles[0].currentOdometer).toBe(1000);
  expect(useAppStore.getState().maintenanceRules[0].lastCompletedKm).toBe(800);
  expect(useAppStore.getState().odometerLogs.at(-1)).toMatchObject({ value: 800, recordedAt: completedAt });
});

it('does not replace the current odometer with a higher historical reading', async () => {
  const today = new Date();
  const completedAt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9).toISOString();
  await useAppStore.getState().completeMaintenance('oil', { completedAt, odometer: 1100 });

  expect(useAppStore.getState().motorcycles[0].currentOdometer).toBe(1000);
  expect(useAppStore.getState().maintenanceRules[0].lastCompletedKm).toBe(1100);
  expect(useAppStore.getState().odometerLogs.at(-1)).toMatchObject({ value: 1100, recordedAt: completedAt });
});

it('keeps completed history when rescheduling fails, and does not alter independent recurring reminders', async () => {
  vi.mocked(updateReminderWithIntegrations).mockRejectedValue(new Error('Native failure'));
  const warning = await useAppStore.getState().completeMaintenance('oil', { completedAt: at, odometer: 1001 });
  expect(warning).toContain('Perawatan tersimpan');
  expect(useAppStore.getState().maintenanceLogs).toHaveLength(1);
  expect(useAppStore.getState().motorcycles[0].currentOdometer).toBe(1001);
  expect(useAppStore.getState().reminders[0].integrationWarning).toBe(warning);
  vi.mocked(updateReminderWithIntegrations).mockClear();
  useAppStore.setState({ reminders: [{ ...reminder, repeat: 'daily' }] });
  await useAppStore.getState().completeMaintenance('oil', { completedAt: at });
  expect(updateReminderWithIntegrations).not.toHaveBeenCalled();
});
