import { beforeEach, expect, it, vi } from 'vitest';
import { useAppStore } from '../src/store/app.store';
import { deleteRemindersWithIntegrations, updateReminderWithIntegrations } from '../src/services/reminder-coordinator';
import type { MaintenanceRule, Motorcycle, Reminder } from '../src/domain/types';

vi.mock('../src/storage/adapter', () => ({ mmkvStorage: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('../src/services/reminder-coordinator', () => ({ deleteRemindersWithIntegrations: vi.fn(), updateReminderWithIntegrations: vi.fn() }));
const at = new Date(2030, 0, 1, 9).toISOString();
const motorcycle = { id: 'm1', currentOdometer: 1000 } as Motorcycle;
const rule = { id: 'oil', motorcycleId: 'm1', type: 'engine-oil', title: 'Oli', lastCompletedKm: 900, intervalDays: 30 } as MaintenanceRule;
const reminder = { id: 'r1', motorcycleId: 'm1', maintenanceRuleId: 'oil', repeat: 'none', scheduledAt: at } as Reminder;

beforeEach(() => {
  vi.resetAllMocks();
  useAppStore.setState({ motorcycles: [motorcycle], maintenanceRules: [rule], reminders: [reminder], maintenanceLogs: [], odometerLogs: [], activeMotorcycleId: 'm1' });
  vi.mocked(updateReminderWithIntegrations).mockImplementation(async (original, changes) => ({ ...original, ...changes }));
});

it('cleans resources before deleting a motorcycle or resetting data, retaining records on failure', async () => {
  vi.mocked(deleteRemindersWithIntegrations).mockRejectedValue(new Error('Offline calendar'));
  await expect(useAppStore.getState().deleteMotorcycle('m1')).rejects.toThrow();
  await expect(useAppStore.getState().resetData()).rejects.toThrow();
  expect(useAppStore.getState().reminders).toHaveLength(1);
  expect(useAppStore.getState().motorcycles).toHaveLength(1);
  vi.mocked(deleteRemindersWithIntegrations).mockResolvedValue(undefined);
  await useAppStore.getState().deleteMotorcycle('m1');
  expect(deleteRemindersWithIntegrations).toHaveBeenCalledWith([reminder]);
  expect(useAppStore.getState().reminders).toHaveLength(0);
});

it('keeps mileage baseline when completion omits mileage and reschedules time-based one-shot reminders', async () => {
  await useAppStore.getState().completeMaintenance('oil', { completedAt: at });
  expect(useAppStore.getState().maintenanceRules[0].lastCompletedKm).toBe(900);
  expect(useAppStore.getState().maintenanceLogs).toHaveLength(1);
  expect(useAppStore.getState().reminders[0].scheduledAt).toBe(new Date(2030, 0, 31, 9).toISOString());
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
