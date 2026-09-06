import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from '@/src/storage/adapter';
import { CURRENT_SCHEMA_VERSION, migratePersistedState } from '@/src/storage/migrations';
import { createRulesForMotorcycle } from '@/src/data/maintenance/templates';
import { deleteRemindersWithIntegrations, updateReminderWithIntegrations } from '@/src/services/reminder-coordinator';
import type { MaintenanceLog, MaintenanceRule, Motorcycle, OdometerLog, Reminder, ThemeMode, UserPreferences } from '@/src/domain/types';

interface AppState {
  schemaVersion: number;
  motorcycles: Motorcycle[];
  activeMotorcycleId?: string;
  odometerLogs: OdometerLog[];
  maintenanceRules: MaintenanceRule[];
  maintenanceLogs: MaintenanceLog[];
  reminders: Reminder[];
  preferences: UserPreferences;
  addMotorcycle: (input: Omit<Motorcycle, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMotorcycle: (id: string, changes: Partial<Motorcycle>) => void;
  deleteMotorcycle: (id: string) => Promise<void>;
  setActiveMotorcycle: (id: string) => void;
  updateOdometer: (motorcycleId: string, value: number) => void;
  updateMaintenanceRule: (id: string, changes: Partial<MaintenanceRule>) => void;
  addCustomRule: (input: Pick<MaintenanceRule, 'motorcycleId' | 'title' | 'intervalKm' | 'intervalDays'>) => void;
  completeMaintenance: (ruleId: string, input: { completedAt: string; odometer?: number; cost?: number; notes?: string }) => Promise<string | undefined>;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, changes: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setUseMotorcycleAccent: (value: boolean) => void;
  resetData: () => Promise<void>;
}

const initialPreferences: UserPreferences = { themeMode: 'system', useMotorcycleAccent: true };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = create<AppState>()(persist((set, get) => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  motorcycles: [],
  odometerLogs: [],
  maintenanceRules: [],
  maintenanceLogs: [],
  reminders: [],
  preferences: initialPreferences,
  addMotorcycle: (input) => {
    const now = new Date().toISOString();
    const id = uid();
    const motorcycle = { ...input, id, createdAt: now, updatedAt: now };
    set((state) => ({
      motorcycles: [...state.motorcycles, motorcycle],
      activeMotorcycleId: state.activeMotorcycleId ?? id,
      odometerLogs: [...state.odometerLogs, { id: uid(), motorcycleId: id, value: input.currentOdometer, recordedAt: now, createdAt: now }],
      maintenanceRules: [...state.maintenanceRules, ...createRulesForMotorcycle(id, input.brand, input.model, input.type, now)],
    }));
    return id;
  },
  updateMotorcycle: (id, changes) => set((state) => ({ motorcycles: state.motorcycles.map((motorcycle) => motorcycle.id === id ? { ...motorcycle, ...changes, updatedAt: new Date().toISOString() } : motorcycle) })),
  deleteMotorcycle: async (id) => {
    await deleteRemindersWithIntegrations(get().reminders.filter((reminder) => reminder.motorcycleId === id));
    set((state) => {
    const motorcycles = state.motorcycles.filter((motorcycle) => motorcycle.id !== id);
    return {
      motorcycles,
      activeMotorcycleId: state.activeMotorcycleId === id ? motorcycles[0]?.id : state.activeMotorcycleId,
      odometerLogs: state.odometerLogs.filter((log) => log.motorcycleId !== id),
      maintenanceRules: state.maintenanceRules.filter((rule) => rule.motorcycleId !== id),
      maintenanceLogs: state.maintenanceLogs.filter((log) => log.motorcycleId !== id),
      reminders: state.reminders.filter((reminder) => reminder.motorcycleId !== id),
    };
    });
  },
  setActiveMotorcycle: (id) => set({ activeMotorcycleId: id }),
  updateOdometer: (motorcycleId, value) => set((state) => {
    const now = new Date().toISOString();
    return {
      motorcycles: state.motorcycles.map((motorcycle) => motorcycle.id === motorcycleId ? { ...motorcycle, currentOdometer: value, updatedAt: now } : motorcycle),
      odometerLogs: [...state.odometerLogs, { id: uid(), motorcycleId, value, recordedAt: now, createdAt: now }],
    };
  }),
  updateMaintenanceRule: (id, changes) => set((state) => ({ maintenanceRules: state.maintenanceRules.map((rule) => rule.id === id ? { ...rule, ...changes, updatedAt: new Date().toISOString() } : rule) })),
  addCustomRule: (input) => set((state) => ({ maintenanceRules: [...state.maintenanceRules, { ...input, id: uid(), type: 'custom', sourceType: 'custom', sourceLabel: 'Jadwal Anda', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })),
  completeMaintenance: async (ruleId, input) => {
    const completedRule = get().maintenanceRules.find((item) => item.id === ruleId);
    if (!completedRule) throw new Error('Jadwal tidak ditemukan.');
    if (!Number.isFinite(new Date(input.completedAt).getTime()) || (input.odometer !== undefined && (!Number.isSafeInteger(input.odometer) || input.odometer < 0))) throw new Error('Catatan perawatan tidak valid.');
    set((state) => {
    const rule = state.maintenanceRules.find((item) => item.id === ruleId);
    if (!rule) return state;
    const log: MaintenanceLog = { id: uid(), motorcycleId: rule.motorcycleId, maintenanceRuleId: rule.id, maintenanceType: rule.type, title: rule.title, ...input, createdAt: new Date().toISOString() };
    const odometerChanged = input.odometer !== undefined;
    return { maintenanceRules: state.maintenanceRules.map((item) => item.id === ruleId ? { ...item, lastCompletedAt: input.completedAt, lastCompletedKm: input.odometer ?? item.lastCompletedKm, updatedAt: new Date().toISOString() } : item), motorcycles: odometerChanged ? state.motorcycles.map((motorcycle) => motorcycle.id === rule.motorcycleId ? { ...motorcycle, currentOdometer: input.odometer!, updatedAt: new Date().toISOString() } : motorcycle) : state.motorcycles, odometerLogs: odometerChanged ? [...state.odometerLogs, { id: uid(), motorcycleId: rule.motorcycleId, value: input.odometer!, recordedAt: input.completedAt, createdAt: new Date().toISOString() }] : state.odometerLogs, maintenanceLogs: [...state.maintenanceLogs, log] };
    });
    // Only time-based, one-shot service reminders follow completion. Recurring reminders keep their own cadence.
    if (!completedRule.intervalDays) return;
    const due = new Date(input.completedAt);
    due.setDate(due.getDate() + completedRule.intervalDays);
    const warnings: string[] = [];
    for (const reminder of get().reminders.filter((item) => item.maintenanceRuleId === ruleId && item.repeat === 'none' && !item.completed)) {
      try {
        const next = await updateReminderWithIntegrations(reminder, { scheduledAt: due.toISOString() });
        get().updateReminder(reminder.id, next);
        if (next.integrationWarning) warnings.push(next.integrationWarning);
      } catch {
        const warning = 'Perawatan tersimpan, tetapi pengingat terkait belum diperbarui. Edit pengingat untuk mencoba lagi.';
        get().updateReminder(reminder.id, { integrationWarning: warning });
        warnings.push(warning);
      }
    }
    return warnings.length ? warnings.join(' ') : undefined;
  },
  addReminder: (reminder) => set((state) => ({ reminders: [...state.reminders, reminder] })),
  updateReminder: (id, changes) => set((state) => ({ reminders: state.reminders.map((reminder) => reminder.id === id ? { ...reminder, ...changes, updatedAt: new Date().toISOString() } : reminder) })),
  deleteReminder: (id) => set((state) => ({ reminders: state.reminders.filter((reminder) => reminder.id !== id) })),
  setThemeMode: (themeMode) => set((state) => ({ preferences: { ...state.preferences, themeMode } })),
  setUseMotorcycleAccent: (value) => set((state) => ({ preferences: { ...state.preferences, useMotorcycleAccent: value } })),
  resetData: async () => {
    await deleteRemindersWithIntegrations(get().reminders);
    set({ schemaVersion: CURRENT_SCHEMA_VERSION, motorcycles: [], activeMotorcycleId: undefined, odometerLogs: [], maintenanceRules: [], maintenanceLogs: [], reminders: [], preferences: initialPreferences });
  },
}), {
  name: 'motorcycle-care-state',
  storage: createJSONStorage(() => mmkvStorage),
  version: CURRENT_SCHEMA_VERSION,
  migrate: (persistedState, version) => migratePersistedState(persistedState, version) as Partial<AppState>,
  partialize: (state) => ({ schemaVersion: state.schemaVersion, motorcycles: state.motorcycles, activeMotorcycleId: state.activeMotorcycleId, odometerLogs: state.odometerLogs, maintenanceRules: state.maintenanceRules, maintenanceLogs: state.maintenanceLogs, reminders: state.reminders, preferences: state.preferences }),
}));

export const selectActiveMotorcycle = (state: AppState) => state.motorcycles.find((motorcycle) => motorcycle.id === state.activeMotorcycleId);
export const selectActiveRules = (state: AppState) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled);
