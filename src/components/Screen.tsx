import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { LAYOUT, SPACING } from '@/src/theme/theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [rootSegment] = useSegments();
  const content = scroll ? <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingHorizontal: width >= LAYOUT.wideBreakpoint ? LAYOUT.wideGutter : LAYOUT.compactGutter }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.colors.background }]}><Animated.View entering={reducedMotion || rootSegment === '(tabs)' ? undefined : FadeInDown.delay(30).duration(260)} style={styles.contentWrap}>{content}</Animated.View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, contentWrap: { flex: 1 }, content: { paddingTop: SPACING.xxl, paddingBottom: SPACING.touch, width: '100%', maxWidth: LAYOUT.contentMaxWidth, alignSelf: 'center' } });
