import { useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions, useIsFocused, useNavigation, type ParamListBase } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabSwipeTarget } from '@/src/domain/tab-swipe';

const icons = { index: 'view-dashboard-outline', garage: 'garage-variant', maintenance: 'wrench-clock-outline', settings: 'cog-outline' } as const;

function SwipeTabScreen({ children }: PropsWithChildren) {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      {children}
      {/* Restrict touch-action to gutters so web chips and inputs keep native gestures. */}
      {(['left', 'right'] as const).map((side) => {
        const swipe = Gesture.Pan()
          .enabled(focused)
          .runOnJS(true)
          .maxPointers(1)
          .activeOffsetX(side === 'left' ? 24 : -24)
          .failOffsetX(side === 'left' ? -12 : 12)
          .failOffsetY([-12, 12])
          .onEnd((event, success) => {
            if (!success || !navigation.isFocused()) return;
            const state = navigation.getState();
            const index = getTabSwipeTarget(state.index, state.routes.length, event.translationX, event.translationY);
            if (index === null) return;
            const target = state.routes[index];
            navigation.dispatch({ ...CommonActions.navigate(target.name, target.params), target: state.key });
          });
        return (
          <GestureDetector key={side} gesture={swipe} touchAction="pan-y">
            <View collapsable={false} accessible={false} style={[styles.edge, { top: insets.top, [side]: insets[side] }]} />
          </GestureDetector>
        );
      })}
    </View>
  );
}

const screenLayout = ({ children }: PropsWithChildren) => <SwipeTabScreen>{children}</SwipeTabScreen>;

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <Tabs screenLayout={screenLayout} screenOptions={({ route }) => ({
        headerShown: false,
        animation: reducedMotion ? 'none' : 'shift',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { height: 70 + Math.max(insets.bottom, 8), paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        tabBarItemStyle: { paddingHorizontal: 3 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />,
      })}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="garage" options={{ title: 'Garage' }} />
        <Tabs.Screen name="maintenance" options={{ title: 'Perawatan' }} />
        <Tabs.Screen name="settings" options={{ title: 'Pengaturan' }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 }, edge: { position: 'absolute', bottom: 0, width: 20 } });
