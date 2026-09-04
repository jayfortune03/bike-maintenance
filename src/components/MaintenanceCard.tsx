import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';
import type { MaintenanceRule, MaintenanceStatus } from '@/src/domain/types';

const labels: Record<MaintenanceStatus, string> = { good: 'Aman', soon: 'Segera', due: 'Sudah waktunya', overdue: 'Terlambat' };
const statusColors: Record<MaintenanceStatus, string> = { good: '#15803D', soon: '#B45309', due: '#C2410C', overdue: '#B91C1C' };

export function MaintenanceCard({ rule, currentOdometer, onPress }: { rule: MaintenanceRule; currentOdometer: number; onPress: () => void }) {
  const theme = useTheme();
  const result = calculateMaintenanceStatus({ currentOdometer, currentDate: new Date().toISOString(), intervalKm: rule.intervalKm, intervalDays: rule.intervalDays, lastCompletedKm: rule.lastCompletedKm, lastCompletedAt: rule.lastCompletedAt });
  const detail = result.status === 'overdue' ? `${result.overdueKm ? `${result.overdueKm.toLocaleString('id-ID')} km terlambat` : `${result.overdueDays} hari terlambat`}` : result.remainingKm ? `${result.remainingKm.toLocaleString('id-ID')} km lagi` : result.remainingDays ? `${result.remainingDays} hari lagi` : 'Sudah waktunya';
  const progress = rule.intervalKm && rule.lastCompletedKm !== undefined ? Math.min(1, Math.max(0, (currentOdometer - rule.lastCompletedKm) / rule.intervalKm)) : 0;
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.75 : 1 }]}><View style={styles.top}><View style={[styles.dot, { backgroundColor: statusColors[result.status] }]} /><View style={styles.name}><Text variant="titleMedium">{rule.title}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{rule.sourceLabel}</Text></View><Text variant="labelLarge" style={{ color: statusColors[result.status] }}>{labels[result.status]}</Text></View><Text variant="bodyMedium" style={styles.detail}>{detail}</Text>{rule.intervalKm ? <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progress} /> : null}<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{rule.lastCompletedKm ? `Terakhir ${rule.lastCompletedKm.toLocaleString('id-ID')} km` : 'Belum pernah dicatat'}</Text></Pressable>;
}

const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }, top: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 }, name: { flex: 1 }, detail: { fontWeight: '600', marginTop: 14, marginBottom: 10 }, progress: { height: 6, borderRadius: 3, marginBottom: 8 } });
