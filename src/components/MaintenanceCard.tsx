import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import type { MaintenanceRule, MaintenanceStatus } from '@/src/domain/types';
import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';
import { maintenanceSummary } from '@/src/domain/maintenance-summary';
import { CARD_SHADOW } from '@/src/theme/theme';

const labels: Record<MaintenanceStatus, string> = { good: 'Aman', soon: 'Segera', due: 'Sudah waktunya', overdue: 'Terlambat' };
const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { 'engine-oil': 'oil', 'gear-oil': 'cog-outline', 'tire-pressure': 'tire', 'tire-condition': 'tire', brake: 'car-brake-alert', 'brake-fluid': 'car-brake-alert', battery: 'car-battery', 'general-service': 'wrench-outline' };

export function MaintenanceCard({ rule, currentOdometer, onPress }: { rule: MaintenanceRule; currentOdometer: number; onPress?: () => void; index?: number }) {
  const theme = useTheme();
  const result = calculateMaintenanceStatus({ currentOdometer, currentDate: new Date().toISOString(), intervalKm: rule.intervalKm, intervalDays: rule.intervalDays, lastCompletedKm: rule.lastCompletedKm, lastCompletedAt: rule.lastCompletedAt });
  const statusColor = (theme.dark
    ? { good: '#86EFAC', soon: '#FDE68A', due: '#FDBA74', overdue: '#FCA5A5' }
    : { good: '#166534', soon: '#854D0E', due: '#9A3412', overdue: '#991B1B' })[result.status];
  const progress = rule.intervalKm && rule.lastCompletedKm !== undefined
    ? Math.min(1, Math.max(0, (currentOdometer - rule.lastCompletedKm) / rule.intervalKm)) : undefined;
  const content = <>
    <View style={styles.top}>
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name={icons[rule.type] ?? 'wrench-outline'} size={22} color={theme.colors.onSurfaceVariant} /></View>
      <View style={styles.copy}>
        <Text variant="titleMedium" style={styles.title}>{rule.title}</Text>
        {rule.sourceLabel ? <Text variant="bodySmall" style={[styles.source, { color: theme.colors.onSurfaceVariant }]}>{rule.sourceLabel}</Text> : null}
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} /> : null}
    </View>
    <View style={styles.statusRow}>
      <Text variant="bodyMedium" style={styles.detail}>{maintenanceSummary(result)}</Text>
      <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}><Text variant="labelMedium" style={{ color: statusColor }}>{labels[result.status]}</Text></View>
    </View>
    {progress !== undefined ? <View accessibilityRole="progressbar" accessibilityLabel="Interval jarak terpakai" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}><View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: statusColor }]} /></View> : null}
    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
      {rule.lastCompletedKm !== undefined ? `Terakhir pada ${rule.lastCompletedKm.toLocaleString('id-ID')} km` : rule.lastCompletedAt ? `Terakhir ${new Date(rule.lastCompletedAt).toLocaleDateString('id-ID')}` : 'Belum pernah dicatat'}
    </Text>
  </>;
  const cardStyle = [styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.75 : 1 }]}>{content}</Pressable> : <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 }, title: { fontWeight: '700', lineHeight: 23 }, source: { marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  detail: { flexGrow: 1, flexShrink: 1, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: 5, borderRadius: 3 },
});
