import dayjs from 'dayjs';
import type { MaintenanceStatusResult } from './types';

export const SOON_THRESHOLD = 0.2;

interface MaintenanceCalculationInput {
  currentOdometer: number;
  currentDate: string;
  intervalKm?: number;
  intervalDays?: number;
  lastCompletedKm?: number;
  lastCompletedAt?: string;
}

export function calculateMaintenanceStatus(input: MaintenanceCalculationInput): MaintenanceStatusResult {
  const distance = input.intervalKm === undefined
    ? undefined
    : {
        dueKm: (input.lastCompletedKm ?? input.currentOdometer) + input.intervalKm,
        remainingKm: (input.lastCompletedKm ?? input.currentOdometer) + input.intervalKm - input.currentOdometer,
      };
  const time = input.intervalDays === undefined
    ? undefined
    : {
        dueDate: dayjs(input.lastCompletedAt ?? input.currentDate).add(input.intervalDays, 'day').toISOString(),
      };
  const remainingDays = time ? dayjs(time.dueDate).diff(dayjs(input.currentDate), 'day') : undefined;
  const distanceOverdue = distance ? Math.max(0, -distance.remainingKm) : 0;
  const timeOverdue = remainingDays === undefined ? 0 : Math.max(0, -remainingDays);
  const distanceDue = distance ? distance.remainingKm <= 0 : false;
  const timeDue = remainingDays !== undefined ? remainingDays <= 0 : false;
  const distanceSoon = distance ? distance.remainingKm > 0 && distance.remainingKm <= input.intervalKm! * SOON_THRESHOLD : false;
  const timeSoon = time && remainingDays !== undefined
    ? remainingDays > 0 && remainingDays <= input.intervalDays! * SOON_THRESHOLD
    : false;

  let primaryTrigger: MaintenanceStatusResult['primaryTrigger'] = null;
  if (distanceDue || distanceSoon) primaryTrigger = 'distance';
  if (timeDue || timeSoon) {
    if (primaryTrigger === null || (remainingDays ?? 0) <= (distance?.remainingKm ?? Infinity)) primaryTrigger = 'time';
  }

  let status: MaintenanceStatusResult['status'] = 'good';
  if (distanceOverdue > 0 || timeOverdue > 0) status = 'overdue';
  else if (distanceDue || timeDue) status = 'due';
  else if (distanceSoon || timeSoon) status = 'soon';

  return {
    status,
    dueKm: distance?.dueKm,
    dueDate: time?.dueDate,
    remainingKm: distance && distance.remainingKm > 0 ? distance.remainingKm : undefined,
    remainingDays: remainingDays !== undefined && remainingDays > 0 ? remainingDays : undefined,
    overdueKm: distanceOverdue || undefined,
    overdueDays: timeOverdue || undefined,
    primaryTrigger,
  };
}
