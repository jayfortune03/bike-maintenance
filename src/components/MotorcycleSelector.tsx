import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Motorcycle } from '@/src/domain/types';

export function MotorcycleSelector({ motorcycle, onPress }: { motorcycle: Motorcycle; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Pilih motor" onPress={onPress} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}><View><Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>MOTOR AKTIF</Text><Text variant="titleLarge">{motorcycle.nickname}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text></View><Text variant="titleMedium" style={{ color: theme.colors.primary }}>⌄</Text></Pressable>;
}

const styles = StyleSheet.create({ container: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 } });
