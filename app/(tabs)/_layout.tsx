import { useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
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

function inputFocused(): boolean {
  if (Platform.OS !== 'web') return TextInput.State.currentlyFocusedInput() !== null;
  const element = document.activeElement;
  return element instanceof HTMLElement && (element.matches('input, textarea, select') || element.isContentEditable);
}

function SwipeTabScreen({ children }: PropsWithChildren) {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const focused = useIsFocused();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const swipe = Gesture.Pan()
    .enabled(focused && !keyboardVisible)
    .runOnJS(true)
    .maxPointers(1)
    .activeOffsetX([-64, 64])
    .failOffsetY([-24, 24])
    .onEnd((event, success) => {
      if (!success || !navigation.isFocused() || inputFocused()) return;
      const state = navigation.getState();
      const index = getTabSwipeTarget(state.index, state.routes.length, event.translationX, event.translationY);
      if (index === null) return;
      const target = state.routes[index];
      navigation.dispatch({ ...CommonActions.navigate(target.name, target.params), target: state.key });
    });

  return (
    <GestureDetector gesture={swipe} touchAction="pan-y">
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
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

const styles = StyleSheet.create({ fill: { flex: 1 } });
