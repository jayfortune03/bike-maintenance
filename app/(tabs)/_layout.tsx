import { forwardRef } from 'react';
import { Pressable, StyleSheet, type View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabList, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwipeTabPager } from '@/src/components/SwipeTabPager';
import { RADII, SPACING } from '@/src/theme/theme';

const TABS = [
  { name: 'index', href: '/', label: 'Beranda', activeIcon: 'view-dashboard', inactiveIcon: 'view-dashboard-outline' },
  { name: 'garage', href: '/garage', label: 'Garasi', activeIcon: 'garage', inactiveIcon: 'garage-variant' },
  { name: 'maintenance', href: '/maintenance', label: 'Perawatan', activeIcon: 'wrench-clock', inactiveIcon: 'wrench-clock-outline' },
  { name: 'settings', href: '/settings', label: 'Pengaturan', activeIcon: 'cog', inactiveIcon: 'cog-outline' },
] as const;
const TAB_NAMES = ['index', 'garage', 'maintenance', 'settings'] as const;

type TabBarButtonProps = Omit<TabTriggerSlotProps, 'children'> & {
  readonly label: string;
  readonly activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly inactiveIcon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TabBarButton = forwardRef<View, TabBarButtonProps>(function TabBarButton(
  { label, activeIcon, inactiveIcon, isFocused = false, ...pressableProps },
  ref,
) {
  const theme = useTheme();
  const color = isFocused ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        { backgroundColor: isFocused ? theme.colors.primaryContainer : theme.colors.surface, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={isFocused ? activeIcon : inactiveIcon} size={SPACING.xxl} color={color} />
      <Text variant="labelSmall" style={{ color }}>{label}</Text>
    </Pressable>
  );
});

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={styles.fill}>
      <Tabs>
        <SwipeTabPager tabNames={TAB_NAMES} />
        <TabList
          accessibilityRole="tablist"
          style={[
            styles.tabBar,
            {
              height: SPACING.touch + SPACING.xxl + Math.max(insets.bottom, SPACING.sm),
              paddingBottom: Math.max(insets.bottom, SPACING.sm),
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} reset="never" asChild>
              <TabBarButton label={tab.label} activeIcon={tab.activeIcon} inactiveIcon={tab.inactiveIcon} />
            </TabTrigger>
          ))}
        </TabList>
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    minHeight: SPACING.touch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADII.control,
  },
});
