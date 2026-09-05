import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';
import type { MaintenanceRule, MaintenanceStatus } from '@/src/domain/types';

const labels: Record<MaintenanceStatus, string> = { good: 'Aman', soon: 'Segera', due: 'Sudah waktunya', overdue: 'Terlambat' };
const statusColors: Record<MaintenanceStatus, string> = { good: '#15803D', soon: '#B45309', due: '#C2410C', overdue: '#B91C1C' };
const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { 'engine-oil': 'oil', 'gear-oil': 'cog-outline', 'tire-pressure': 'tire', 'tire-condition': 'tire', brake: 'car-brake-alert', 'brake-fluid': 'car-brake-alert', battery: 'car-battery', custom: 'wrench-outline' };

export function MaintenanceCard({ rule, currentOdometer, onPress }: { rule: MaintenanceRule; currentOdometer: number; onPress: () => void }) {
  const theme = useTheme();
  const result = calculateMaintenanceStatus({ currentOdometer, currentDate: new Date().toISOString(), intervalKm: rule.intervalKm, intervalDays: rule.intervalDays, lastCompletedKm: rule.lastCompletedKm, lastCompletedAt: rule.lastCompletedAt });
  const detail = result.status === 'overdue' ? `${result.overdueKm ? `${result.overdueKm.toLocaleString('id-ID')} km terlambat` : `${result.overdueDays} hari terlambat`}` : result.remainingKm ? `${result.remainingKm.toLocaleString('id-ID')} km lagi` : result.remainingDays ? `${result.remainingDays} hari lagi` : 'Sudah waktunya';
  const progress = rule.intervalKm && rule.lastCompletedKm !== undefined ? Math.min(1, Math.max(0, (currentOdometer - rule.lastCompletedKm) / rule.intervalKm)) : 0;
  const statusColor = statusColors[result.status];
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.78 : 1 }]}><View style={styles.top}><View style={[styles.icon, { backgroundColor: `${statusColor}18` }]}><MaterialCommunityIcons name={icons[rule.type] ?? 'wrench-outline'} size={20} color={statusColor} /></View><View style={styles.name}><Text variant="titleMedium" style={styles.title}>{rule.title}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{rule.sourceLabel}</Text></View><View style={[styles.status, { backgroundColor: `${statusColor}18` }]}><Text variant="labelSmall" style={{ color: statusColor, fontWeight: '700' }}>{labels[result.status]}</Text></View></View><Text variant="bodyMedium" style={[styles.detail, { color: theme.colors.onSurface }]}>{detail}</Text>{rule.intervalKm ? <ProgressBar progress={progress} color={statusColor} style={styles.progress} /> : null}<View style={styles.footer}><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{rule.lastCompletedKm ? `Terakhir ${rule.lastCompletedKm.toLocaleString('id-ID')} km` : 'Belum pernah dicatat'}</Text><MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} /></View></Pressable>;
}

const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 }, top: { flexDirection: 'row', alignItems: 'center' }, icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, name: { flex: 1 }, title: { fontWeight: '700' }, status: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8 }, detail: { fontWeight: '700', marginTop: 16, marginBottom: 10 }, progress: { height: 7, borderRadius: 4, marginBottom: 9 }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
