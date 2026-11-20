import { calculateMaintenanceStatus } from './maintenance-calculator';
import type { MaintenanceRule, Motorcycle } from './types';

export type OilReminderPlan = {
  cycle: string;
  dueDate?: string;
  distanceDue: boolean;
  timeDue: boolean;
};

export function oilReminderPlan(rule: MaintenanceRule, motorcycle: Motorcycle, currentDate: string): OilReminderPlan | null {
  const intervalKm = rule.lastCompletedKm === undefined ? undefined : rule.intervalKm;
  const intervalDays = rule.lastCompletedAt === undefined ? undefined : rule.intervalDays;
  if (intervalKm === undefined && intervalDays === undefined) return null;
  const result = calculateMaintenanceStatus({
    currentOdometer: motorcycle.currentOdometer,
    currentDate,
    intervalKm,
    intervalDays,
    lastCompletedKm: rule.lastCompletedKm,
    lastCompletedAt: rule.lastCompletedAt,
  });
  const distanceDue = result.dueKm !== undefined && motorcycle.currentOdometer >= result.dueKm;
  const timeDue = result.dueDate !== undefined && new Date(result.dueDate).getTime() <= new Date(currentDate).getTime();
  return {
    cycle: JSON.stringify([rule.id, result.dueKm ?? null, result.dueDate ?? null]),
    dueDate: result.dueDate,
    distanceDue,
    timeDue,
  };
}
