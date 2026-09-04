import { describe, expect, it } from 'vitest';
import { createRulesForMotorcycle, getTemplateRules } from '@/src/data/maintenance/templates';

describe('maintenance templates', () => {
  it('falls back to the motorcycle type for an unknown model', () => expect(getTemplateRules('Unknown', 'Unknown', 'scooter').some((rule) => rule.type === 'cvt')).toBe(true));
  it('copies rules to the motorcycle without mutating static data', () => {
    const rules = createRulesForMotorcycle('bike-1', 'Honda', 'BeAT', 'scooter');
    expect(rules.every((rule) => rule.motorcycleId === 'bike-1' && rule.id.startsWith('bike-1-'))).toBe(true);
  });
});
