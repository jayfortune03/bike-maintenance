import type { MaintenanceStatusResult } from './types';

export function maintenanceSummary(result: MaintenanceStatusResult): string {
  if (result.status === 'due') return 'Waktunya melakukan perawatan';
  if (result.status === 'overdue') return [
    result.overdueKm && `${result.overdueKm.toLocaleString('id-ID')} km`,
    result.overdueDays && `${result.overdueDays} hari`,
  ].filter(Boolean).join(' / ') + ' terlambat';
  return [
    result.remainingKm !== undefined && `${result.remainingKm.toLocaleString('id-ID')} km`,
    result.remainingDays !== undefined && `${result.remainingDays} hari`,
  ].filter(Boolean).join(' / ') + ' lagi';
}
