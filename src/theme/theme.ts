import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { ThemeMode } from '@/src/domain/types';

export const BLUE = '#2563EB';
export const ORANGE = '#EA580C';
export const CARD_SHADOW = { elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } as const;

function readableAccent(color: string): string {
  const normalized = color.replace('#', '');
  if (normalized.length !== 6) return BLUE;
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? '#1D4ED8' : color;
}

export function getAppTheme(mode: ThemeMode, systemIsDark: boolean, accent = BLUE): MD3Theme {
  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 18,
    colors: {
      ...base.colors,
      primary: readableAccent(accent),
      secondary: readableAccent(accent),
      tertiary: ORANGE,
      onTertiary: '#FFFFFF',
      background: isDark ? '#0B1220' : '#F5F7FB',
      surface: isDark ? '#121C2E' : '#FFFFFF',
      surfaceVariant: isDark ? '#1D2A3D' : '#EEF2F7',
      outlineVariant: isDark ? '#334155' : '#E2E8F0',
    },
  };
}
