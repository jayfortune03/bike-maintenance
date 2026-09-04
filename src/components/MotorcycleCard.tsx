import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Motorcycle } from '@/src/domain/types';

export function MotorcycleCard({ motorcycle, active, onPress }: { motorcycle: Motorcycle; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.outlineVariant, opacity: pressed ? 0.75 : 1 }]}><View style={[styles.color, { backgroundColor: motorcycle.themeColor }]}><Text style={styles.initials}>{motorcycle.model.slice(0, 2).toUpperCase()}</Text></View><View style={styles.copy}><View style={styles.heading}><Text variant="titleMedium">{motorcycle.nickname}</Text>{active ? <Text variant="labelMedium" style={{ color: theme.colors.primary }}>AKTIF</Text> : null}</View><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>{motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text></View><Text variant="titleLarge" style={{ color: theme.colors.onSurfaceVariant }}>›</Text></Pressable>;
}

const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 }, color: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, initials: { color: '#FFF', fontWeight: '700' }, copy: { flex: 1, marginLeft: 14 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } });
