import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { TabSlot, useTabTrigger, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { getTabDragPosition, getTabSwipeTarget, TAB_SWIPE } from '@/src/domain/tab-swipe';

const SNAP_SPRING = { damping: 24, stiffness: 260, mass: 0.85, overshootClamping: true } as const;
const BLUR_INTENSITY = 8;
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type SwipeTabPagerProps = {
  readonly tabNames: readonly [string, ...string[]];
};

type PagerPageProps = PropsWithChildren<{
  readonly index: number;
  readonly committedIndex: number;
  readonly position: SharedValue<number>;
  readonly width: number;
}>;

function PagerPage({ index, committedIndex, position, width, children }: PagerPageProps) {
  const active = index === committedIndex;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (index - position.value) * width }],
  }), [index, width]);
  const webInert = Platform.OS === 'web' && !active ? { inert: true } : {};

  return (
    <Animated.View
      {...webInert}
      aria-hidden={!active}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      pointerEvents={active ? 'auto' : 'none'}
      style={[styles.page, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

export function SwipeTabPager({ tabNames }: SwipeTabPagerProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const committedIndex = useNavigationState((state) => state.index);
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [webInputFocused, setWebInputFocused] = useState(false);
  const position = useSharedValue(committedIndex);
  const dragStart = useSharedValue(committedIndex);
  const { switchTab } = useTabTrigger({ name: tabNames[0] });

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const focusIn = (event: FocusEvent) => {
      const element = event.target;
      setWebInputFocused(element instanceof HTMLElement
        && (element.matches('input, textarea, select') || element.isContentEditable));
    };
    const focusOut = () => setWebInputFocused(false);
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', focusOut);
    return () => {
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', focusOut);
    };
  }, []);

  const commitTab = useCallback((index: number) => {
    const name = tabNames[index];
    if (name !== undefined) switchTab(name, { reset: 'never' });
  }, [switchTab, tabNames]);

  useEffect(() => {
    cancelAnimation(position);
    position.value = reducedMotion ? committedIndex : withSpring(committedIndex, SNAP_SPRING);
  }, [committedIndex, position, reducedMotion]);

  const settle = (target: number, commit: boolean) => {
    'worklet';
    cancelAnimation(position);
    if (reducedMotion) {
      position.value = target;
      if (commit) runOnJS(commitTab)(target);
      return;
    }
    position.value = withSpring(target, SNAP_SPRING, (finished) => {
      if (finished && commit) runOnJS(commitTab)(target);
    });
  };

  const swipe = Gesture.Pan()
    .enabled(!keyboardVisible && !webInputFocused)
    .maxPointers(1)
    .activeOffsetX([-TAB_SWIPE.activationDistance, TAB_SWIPE.activationDistance])
    .failOffsetY([-TAB_SWIPE.verticalFailureDistance, TAB_SWIPE.verticalFailureDistance])
    .onStart(() => {
      cancelAnimation(position);
      dragStart.value = position.value;
    })
    .onUpdate((event) => {
      position.value = getTabDragPosition({
        startPosition: dragStart.value,
        count: tabNames.length,
        translationX: event.translationX,
        width,
      });
    })
    .onEnd((event, success) => {
      if (!success) {
        settle(committedIndex, false);
        return;
      }
      const target = getTabSwipeTarget({
        index: committedIndex,
        count: tabNames.length,
        translationX: event.translationX,
        translationY: event.translationY,
        velocityX: event.velocityX,
        width,
      });
      settle(target ?? committedIndex, target !== null);
    });

  const renderPage = useCallback((descriptor: TabsDescriptor, options: TabsSlotRenderOptions) => (
    <PagerPage
      key={descriptor.route.key}
      index={options.index}
      committedIndex={committedIndex}
      position={position}
      width={width}
    >
      {descriptor.render()}
    </PagerPage>
  ), [committedIndex, position, width]);

  const blurStyle = useAnimatedStyle(() => {
    const distance = position.value - committedIndex;
    const revealed = Math.min(1, Math.abs(distance));
    const direction = distance < 0 ? -1 : 1;
    return {
      opacity: reducedMotion ? 0 : Math.min(1, revealed / TAB_SWIPE.commitFraction),
      transform: [{ translateX: direction * width * (1 - revealed) }],
    };
  }, [committedIndex, reducedMotion, width]);
  const blurProps = useAnimatedProps(() => ({
    intensity: reducedMotion
      ? 0
      : BLUR_INTENSITY * Math.min(1, Math.abs(position.value - committedIndex) / TAB_SWIPE.commitFraction),
  }), [committedIndex, reducedMotion]);

  return (
    <GestureDetector gesture={swipe} touchAction="pan-y">
      <View style={styles.pager}>
        <TabSlot detachInactiveScreens={false} renderFn={renderPage} style={styles.slot} />
        <Animated.View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, blurStyle]}
        >
          <AnimatedBlurView
            animatedProps={blurProps}
            experimentalBlurMethod="dimezisBlurView"
            pointerEvents="none"
            tint={theme.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1, overflow: 'hidden' },
  slot: { flex: 1 },
  page: { ...StyleSheet.absoluteFillObject },
});
