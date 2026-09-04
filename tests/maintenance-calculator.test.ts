import { describe, expect, it } from 'vitest';
import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';

const base = { currentDate: '2026-09-04T00:00:00.000Z', currentOdometer: 12450, intervalKm: 3000, lastCompletedKm: 10000, intervalDays: 90, lastCompletedAt: '2026-06-20T00:00:00.000Z' };

describe('calculateMaintenanceStatus', () => {
  it('returns soon when the remaining distance is within twenty percent', () => expect(calculateMaintenanceStatus(base).status).toBe('soon'));
  it('returns overdue for distance', () => expect(calculateMaintenanceStatus({ ...base, currentOdometer: 14001, intervalDays: undefined }).status).toBe('overdue'));
  it('returns due for time', () => expect(calculateMaintenanceStatus({ ...base, currentDate: '2026-09-18T00:00:00.000Z', intervalKm: undefined }).status).toBe('due'));
  it('supports distance-only rules', () => expect(calculateMaintenanceStatus({ ...base, intervalDays: undefined }).remainingKm).toBe(550));
  it('supports time-only rules', () => expect(calculateMaintenanceStatus({ ...base, intervalKm: undefined }).dueDate).toBeTruthy());
});
