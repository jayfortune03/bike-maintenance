import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { Motorcycle } from '@/src/domain/types';
import { CARD_SHADOW } from '@/src/theme/theme';
import { MotorcycleVisual } from '@/src/components/MotorcycleVisual';

export function MotorcycleCard({ motorcycle, active, onPress, index = 0 }: { motorcycle: Motorcycle; active: boolean; onPress: () => void; index?: number }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(index, 5) * 55).duration(260)}><Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.outlineVariant, opacity: pressed ? 0.78 : 1 }]}><MotorcycleVisual color={motorcycle.themeColor} photoUri={motorcycle.photoUri} size={64} /><View style={styles.copy}><View style={styles.heading}><Text variant="titleMedium" style={styles.name}>{motorcycle.nickname}</Text>{active ? <Text variant="labelSmall" style={[styles.active, { color: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }]}>AKTIF</Text> : null}</View><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text><View style={styles.meta}><MaterialCommunityIcons name="speedometer" size={15} color={theme.colors.onSurfaceVariant} /><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 5 }}>{motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text></View></View><MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} /></Pressable></Animated.View>;
}

const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, gap: 12 }, copy: { flex: 1, minWidth: 0 }, heading: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }, name: { fontWeight: '700', flexGrow: 1, flexShrink: 1 }, active: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 } });
