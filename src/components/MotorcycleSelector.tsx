import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Motorcycle } from '@/src/domain/types';
import { CARD_SHADOW } from '@/src/theme/theme';
import { MotorcycleVisual } from '@/src/components/MotorcycleVisual';
import { RADII, SPACING } from '@/src/theme/theme';

export function MotorcycleSelector({ motorcycle, onPress }: { motorcycle: Motorcycle; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Pilih motor, saat ini ${motorcycle.nickname}`} accessibilityHint="Buka daftar motor" onPress={onPress} style={({ pressed }) => [styles.container, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.78 : 1 }]}><MotorcycleVisual color={motorcycle.themeColor} photoUri={motorcycle.photoUri} size={48} /><View style={styles.copy}><Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.8 }}>MOTOR AKTIF</Text><Text variant="titleMedium" style={styles.name}>{motorcycle.nickname}</Text><Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text></View><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.change}><Text variant="labelMedium" style={{ color: theme.colors.primary }}>Ganti</Text><MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.primary} /></View>
  </Pressable>;
}

const styles = StyleSheet.create({ container: { minHeight: 88, flexDirection: 'row', gap: SPACING.md, alignItems: 'center', borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg }, copy: { flex: 1, minWidth: 0 }, name: { marginTop: 2 }, change: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } });
