import { describe, expect, it } from 'vitest';
import { isBeforeToday } from '../src/domain/date';

describe('isBeforeToday', () => {
  const today = new Date(2026, 8, 28, 9);

  it('recognizes an earlier calendar day as a historical date', () => {
    expect(isBeforeToday('2026-09-27T00:00', today)).toBe(true);
  });

  it('does not treat an earlier time on the current day as historical', () => {
    expect(isBeforeToday('2026-09-28T00:00', today)).toBe(false);
  });
});
