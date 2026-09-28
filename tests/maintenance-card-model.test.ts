import { describe, expect, it } from 'vitest';
import { buildMaintenanceCardModel } from '../src/components/maintenance-card-model';
import type { MaintenanceRule } from '../src/domain/types';

const baseRule: MaintenanceRule = {
  id: 'oil-rule',
  motorcycleId: 'motorcycle',
  type: 'engine-oil',
  title: 'Ganti oli mesin',
  intervalKm: 4_000,
  intervalDays: 100,
  sourceType: 'generic',
  sourceLabel: 'Rekomendasi umum',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('maintenance card model', () => {
  it('stays untracked when no real completion baseline exists', () => {
    // Given a generated rule that has never been completed
    // When the UI model is built
    const model = buildMaintenanceCardModel(baseRule, 12_000, '2026-02-10T00:00:00.000Z');

    // Then it does not fabricate a healthy status or progress
    expect(model).toMatchObject({ tracking: 'untracked', status: null });
    expect(model.distance).toBeUndefined();
    expect(model.time).toBeUndefined();
  });

  it('exposes both completion facts and used versus remaining progress', () => {
    // Given an oil rule with a date and odometer baseline
    const rule = { ...baseRule, lastCompletedKm: 11_000, lastCompletedAt: '2026-01-01T00:00:00.000Z' };

    // When the UI model is built 1,000 km and 40 days later
    const model = buildMaintenanceCardModel(rule, 12_000, '2026-02-10T00:00:00.000Z');

    // Then both dimensions remain visible and independently measurable
    expect(model).toMatchObject({
      tracking: 'tracked',
      status: 'good',
      lastCompletedKm: 11_000,
      lastCompletedAt: '2026-01-01T00:00:00.000Z',
      distance: { used: 1_000, remaining: 3_000, fraction: 0.25 },
      time: { used: 40, remaining: 60, fraction: 0.4 },
    });
  });

  it('tracks only the dimension backed by recorded history', () => {
    // Given a rule with a completion date but no completion odometer
    const rule = { ...baseRule, lastCompletedAt: '2026-01-01T00:00:00.000Z' };

    // When the UI model is built
    const model = buildMaintenanceCardModel(rule, 12_000, '2026-02-10T00:00:00.000Z');

    // Then time is tracked without inventing a distance baseline
    expect(model.tracking).toBe('tracked');
    expect(model.distance).toBeUndefined();
    expect(model.time).toMatchObject({ used: 40, remaining: 60, fraction: 0.4 });
  });

  it('shows a full progress track when the interval is exactly due', () => {
    // Given an oil rule at its exact distance interval
    const rule = { ...baseRule, intervalDays: undefined, lastCompletedKm: 8_000 };

    // When the UI model is built at the due odometer
    const model = buildMaintenanceCardModel(rule, 12_000, '2026-02-10T00:00:00.000Z');

    // Then the distance is due with a full, non-overdue track
    expect(model).toMatchObject({ tracking: 'tracked', status: 'due', distance: { used: 4_000, remaining: 0, overdue: 0, fraction: 1 } });
  });

  it('separates overdue distance from the capped progress track', () => {
    // Given an oil rule beyond its distance interval
    const rule = { ...baseRule, intervalDays: undefined, lastCompletedKm: 7_000 };

    // When the UI model is built at the current odometer
    const model = buildMaintenanceCardModel(rule, 12_000, '2026-02-10T00:00:00.000Z');

    // Then the track stays capped while the overdue amount remains explicit
    expect(model).toMatchObject({ tracking: 'tracked', status: 'overdue', distance: { used: 4_000, remaining: 0, overdue: 1_000, fraction: 1 } });
  });
});
