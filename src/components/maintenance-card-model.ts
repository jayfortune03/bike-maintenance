import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';
import type { MaintenanceRule, MaintenanceStatus, MaintenanceStatusResult } from '@/src/domain/types';

export type MaintenanceProgress = {
  readonly used: number;
  readonly remaining: number;
  readonly overdue: number;
  readonly fraction: number;
};

type MaintenanceCardModel = {
  readonly tracking: 'tracked';
  readonly status: MaintenanceStatus;
  readonly result: MaintenanceStatusResult;
  readonly lastCompletedKm?: number;
  readonly lastCompletedAt?: string;
  readonly distance?: MaintenanceProgress;
  readonly time?: MaintenanceProgress;
} | {
  readonly tracking: 'untracked';
  readonly status: null;
  readonly lastCompletedKm?: number;
  readonly lastCompletedAt?: string;
  readonly distance?: undefined;
  readonly time?: undefined;
};

function progress(interval: number, remaining = 0, overdue = 0): MaintenanceProgress {
  const used = Math.min(interval, Math.max(0, interval - remaining));
  return { used, remaining, overdue, fraction: used / interval };
}

export function buildMaintenanceCardModel(rule: MaintenanceRule, currentOdometer: number, currentDate: string): MaintenanceCardModel {
  const intervalKm = rule.lastCompletedKm === undefined ? undefined : rule.intervalKm;
  const intervalDays = rule.lastCompletedAt === undefined ? undefined : rule.intervalDays;
  const shared = { lastCompletedKm: rule.lastCompletedKm, lastCompletedAt: rule.lastCompletedAt };

  if (intervalKm === undefined && intervalDays === undefined) return { tracking: 'untracked', status: null, ...shared };

  const result = calculateMaintenanceStatus({
    currentOdometer,
    currentDate,
    intervalKm,
    intervalDays,
    lastCompletedKm: rule.lastCompletedKm,
    lastCompletedAt: rule.lastCompletedAt,
  });

  return {
    tracking: 'tracked',
    status: result.status,
    result,
    ...shared,
    distance: intervalKm === undefined ? undefined : progress(intervalKm, result.remainingKm, result.overdueKm),
    time: intervalDays === undefined ? undefined : progress(intervalDays, result.remainingDays, result.overdueDays),
  };
}
