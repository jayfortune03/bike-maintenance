import { describe, expect, it } from 'vitest';
import { accentColors, contrastTextColor } from '../src/theme/accent';
import { MOTORCYCLE_COLORS } from '../src/data/motorcycle-colors';
import { maintenanceSummary } from '../src/domain/maintenance-summary';

const luminance = (hex: string) => [1, 3, 5].reduce((sum, offset, index) => {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return sum + (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index];
}, 0);

const contrast = (foreground: string, background: string) => {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe('UI presentation', () => {
  it('uses a valid, contrasting accent and label in each theme', () => {
    for (const accent of ['#DC2626', '#2563EB', '#FFFFFF', '#000000', '#FFFF00', 'invalid']) {
      for (const dark of [true, false]) {
        const palette = accentColors(accent, dark);
        for (const [foreground, background] of [[palette.primary, dark ? '#18201D' : '#FFFDF8'], [palette.onPrimary, palette.primary], [palette.onPrimaryContainer, palette.primaryContainer]]) {
          expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
  it('keeps every motorcycle color label readable on its swatch', () => {
    for (const color of MOTORCYCLE_COLORS) {
      expect(contrast(contrastTextColor(color.value), color.value)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('does not hide time-based due status behind remaining distance', () => {
    expect(maintenanceSummary({ status: 'due', primaryTrigger: 'time', remainingKm: 3000 })).toBe('Waktunya melakukan perawatan');
    expect(maintenanceSummary({ status: 'soon', primaryTrigger: 'time', remainingKm: 3000, remainingDays: 2 })).toBe('3.000 km / 2 hari lagi');
    expect(maintenanceSummary({ status: 'overdue', primaryTrigger: 'time', overdueDays: 2 })).toBe('2 hari terlambat');
  });
});
