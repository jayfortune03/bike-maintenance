import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Motorcycle } from '@/src/domain/types';
import { CARD_SHADOW } from '@/src/theme/theme';

export function MotorcycleSelector({ motorcycle, onPress }: { motorcycle: Motorcycle; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Pilih motor" onPress={onPress} style={({ pressed }) => [styles.container, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.78 : 1 }]}><View style={[styles.avatar, { backgroundColor: motorcycle.themeColor }]}><MaterialCommunityIcons name="motorbike" size={22} color="#FFFFFF" /></View><View style={styles.copy}><Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.8 }}>MOTOR AKTIF</Text><Text variant="titleMedium" style={styles.name}>{motorcycle.nickname}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text></View><MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.onSurfaceVariant} />
  </Pressable>;
}

const styles = StyleSheet.create({ container: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, padding: 12 }, avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12 }, name: { fontWeight: '700', marginTop: 2 } });
