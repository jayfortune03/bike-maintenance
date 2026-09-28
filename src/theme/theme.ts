import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { MaintenanceStatus, ThemeMode } from '@/src/domain/types';
import { accentColors } from './accent';

export const BLUE = '#2563EB';
export const ORANGE = '#EA580C';
export const CARD_SHADOW = { elevation: 2, boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.10)' } as const;

export function maintenanceStatusColors(dark: boolean): Record<MaintenanceStatus, string> {
  return dark
    ? { good: '#86EFAC', soon: '#FDE68A', due: '#FDBA74', overdue: '#FCA5A5' }
    : { good: '#166534', soon: '#854D0E', due: '#9A3412', overdue: '#991B1B' };
}

export function getAppTheme(mode: ThemeMode, systemIsDark: boolean, accent = BLUE): MD3Theme {
  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const palette = accentColors(accent, isDark);
  return {
    ...base,
    roundness: 12,
    colors: {
      ...base.colors,
      ...palette,
      secondary: palette.primary,
      onSecondary: palette.onPrimary,
      secondaryContainer: palette.primaryContainer,
      onSecondaryContainer: palette.onPrimaryContainer,
      tertiary: isDark ? '#FDBA74' : '#9A3412',
      onTertiary: isDark ? '#431407' : '#FFFFFF',
      background: isDark ? '#0D131D' : '#F4F6F9',
      surface: isDark ? '#18212E' : '#FFFFFF',
      onSurface: isDark ? '#F1F5F9' : '#172033',
      onBackground: isDark ? '#F1F5F9' : '#172033',
      surfaceVariant: isDark ? '#253142' : '#E9EEF5',
      onSurfaceVariant: isDark ? '#BAC5D4' : '#526077',
      outline: isDark ? '#6F8096' : '#758399',
      outlineVariant: isDark ? '#2C3A4D' : '#DFE5ED',
      backdrop: 'rgba(4, 9, 18, 0.52)',
      elevation: { level0: 'transparent', level1: isDark ? '#18212E' : '#FFFFFF', level2: isDark ? '#202B3A' : '#F8FAFC', level3: isDark ? '#253142' : '#F1F5F9', level4: isDark ? '#29364A' : '#EBF0F6', level5: isDark ? '#304057' : '#E5ECF4' },
    },
  };
}
