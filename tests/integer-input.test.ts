import { describe, expect, it } from 'vitest';
import { formatIntegerInput, parseIntegerInput } from '../src/domain/integer-input';

describe('integer input', () => {
  it('formats typed digits with Indonesian thousand separators', () => {
    // Given digits entered with or without existing separators
    // When the input is normalized for display
    // Then only digits remain and groups use a dot
    expect(formatIntegerInput('12000')).toBe('12.000');
    expect(formatIntegerInput('12.000 km')).toBe('12.000');
  });

  it('parses formatted input back to an integer', () => {
    // Given a formatted kilometer input
    // When it crosses the numeric boundary
    // Then the stored value is an integer and blank remains absent
    expect(parseIntegerInput('12.000')).toBe(12_000);
    expect(parseIntegerInput('')).toBeUndefined();
  });
});
