import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { ThemeMode } from '@/src/domain/types';

export const BLUE = '#2563EB';

function readableAccent(color: string): string {
  const normalized = color.replace('#', '');
  if (normalized.length !== 6) return BLUE;
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? '#1D4ED8' : color;
}

export function getAppTheme(mode: ThemeMode, systemIsDark: boolean, accent = BLUE): MD3Theme {
  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return { ...base, colors: { ...base.colors, primary: readableAccent(accent), secondary: readableAccent(accent), background: isDark ? '#111827' : '#F8FAFC', surface: isDark ? '#1F2937' : '#FFFFFF', surfaceVariant: isDark ? '#374151' : '#EEF2F7' } };
}
