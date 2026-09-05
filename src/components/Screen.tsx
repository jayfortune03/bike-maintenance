import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const content = scroll ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children;
  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.background }]}><Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(30).duration(260)} style={styles.contentWrap}>{content}</Animated.View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, contentWrap: { flex: 1 }, content: { padding: 20, paddingBottom: 48 } });
