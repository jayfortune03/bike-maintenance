import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Sheet({ visible, onDismiss, children }: PropsWithChildren<{
  visible: boolean;
  onDismiss: () => void;
}>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [mounted, setMounted] = useState(visible);
  const [shown, setShown] = useState(false);
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (!shown || !height) {
      if (!visible) { setShown(false); setMounted(false); }
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(progress, {
        toValue: visible ? 1 : 0,
        duration: reducedMotion ? 0 : visible ? 300 : 220,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: reducedMotion ? 0 : 180,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start(({ finished }) => {
      // Keep the native modal mounted until the panel and backdrop finish closing.
      if (finished && !visible) {
        setShown(false);
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [visible, mounted, shown, height, reducedMotion, progress, backdropOpacity]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onShow={() => setShown(true)} onRequestClose={onDismiss}>
      <Animated.View testID="sheet-backdrop" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.backdrop, opacity: backdropOpacity }]}>
        <Pressable accessible={false} onPress={onDismiss} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { paddingTop: insets.top + 24, paddingLeft: insets.left, paddingRight: insets.right }]}
      >
        <Animated.View
          testID="sheet-panel"
          accessibilityViewIsModal
          onAccessibilityEscape={onDismiss}
          pointerEvents={visible ? 'auto' : 'none'}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          style={[styles.panel, {
            backgroundColor: theme.colors.surface,
            opacity: height ? 1 : 0,
            transform: [{ translateY: reducedMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }],
          }]}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  panel: { maxHeight: '100%', width: '100%', maxWidth: 640, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
});
