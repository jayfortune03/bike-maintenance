import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { MaintenanceStatus, ThemeMode } from '@/src/domain/types';
import { accentColors } from './accent';

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 28, wide: 32, touch: 48 } as const;
export const RADII = { badge: 10, control: 14, compact: 18, card: 24, featured: 28 } as const;
export const LAYOUT = { wideBreakpoint: 768, contentMaxWidth: 1120, compactGutter: 20, wideGutter: 32 } as const;
export const BLUE = '#0F766E';
export const ORANGE = '#EA580C';
export const CARD_SHADOW = { elevation: 1, boxShadow: '0px 8px 24px rgba(31, 41, 37, 0.08)' } as const;

export function maintenanceStatusColors(dark: boolean): Record<MaintenanceStatus, string> {
  return dark
    ? { good: '#86EFAC', soon: '#FDE68A', due: '#FDBA74', overdue: '#FCA5A5' }
    : { good: '#166534', soon: '#7C4A03', due: '#9A3412', overdue: '#991B1B' };
}

export function getAppTheme(mode: ThemeMode, systemIsDark: boolean, accent = BLUE): MD3Theme {
  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const palette = accentColors(accent, isDark);
  return {
    ...base,
    roundness: RADII.control,
    fonts: {
      ...base.fonts,
      displaySmall: { ...base.fonts.displaySmall, fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -1 },
      headlineSmall: { ...base.fonts.headlineSmall, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
      titleMedium: { ...base.fonts.titleMedium, fontSize: 17, lineHeight: 24, fontWeight: '700' },
      titleSmall: { ...base.fonts.titleSmall, fontWeight: '600' },
      bodyMedium: { ...base.fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
      labelLarge: { ...base.fonts.labelLarge, fontWeight: '600' },
    },
    colors: {
      ...base.colors,
      ...palette,
      secondary: palette.primary,
      onSecondary: palette.onPrimary,
      secondaryContainer: palette.primaryContainer,
      onSecondaryContainer: palette.onPrimaryContainer,
      tertiary: isDark ? '#FDBA74' : '#9A3412',
      onTertiary: isDark ? '#431407' : '#FFFFFF',
      background: isDark ? '#101614' : '#F5F3EE',
      surface: isDark ? '#18201D' : '#FFFDF8',
      onSurface: isDark ? '#F4F3ED' : '#18201F',
      onBackground: isDark ? '#F4F3ED' : '#18201F',
      surfaceVariant: isDark ? '#25302C' : '#ECE9E1',
      onSurfaceVariant: isDark ? '#B9C2BE' : '#596561',
      outline: isDark ? '#84918C' : '#74807B',
      outlineVariant: isDark ? '#33403B' : '#DCD8CE',
      backdrop: 'rgba(4, 9, 18, 0.52)',
      elevation: { level0: 'transparent', level1: isDark ? '#18201D' : '#FFFDF8', level2: isDark ? '#202A26' : '#FAF8F2', level3: isDark ? '#25302C' : '#F2EFE8', level4: isDark ? '#2A3732' : '#ECE8DF', level5: isDark ? '#30403A' : '#E5E0D6' },
    },
  };
}
