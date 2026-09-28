import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import type { MaintenanceRule, MaintenanceStatus } from '@/src/domain/types';
import { maintenanceSummary } from '@/src/domain/maintenance-summary';
import { buildMaintenanceCardModel, type MaintenanceProgress } from '@/src/components/maintenance-card-model';
import { CARD_SHADOW, maintenanceStatusColors } from '@/src/theme/theme';

const labels: Record<MaintenanceStatus, string> = { good: 'Aman', soon: 'Segera', due: 'Sudah waktunya', overdue: 'Terlambat' };
const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { 'engine-oil': 'oil', 'gear-oil': 'cog-outline', 'tire-pressure': 'tire', 'tire-condition': 'tire', brake: 'car-brake-alert', 'brake-fluid': 'car-brake-alert', battery: 'car-battery', 'general-service': 'wrench-outline' };

function progressText(value: MaintenanceProgress, unit: string): string {
  const used = `${value.used.toLocaleString('id-ID')} ${unit}`;
  const remaining = value.overdue > 0 ? `Lewat ${value.overdue.toLocaleString('id-ID')} ${unit}` : `Tersisa ${value.remaining.toLocaleString('id-ID')} ${unit}`;
  return `Terpakai ${used} · ${remaining}`;
}

function ProgressRow({ label, unit, value, color, exposeProgress }: { readonly label: string; readonly unit: string; readonly value: MaintenanceProgress; readonly color: string; readonly exposeProgress: boolean }) {
  const theme = useTheme();
  return <View style={styles.progressBlock}>
    <View style={styles.progressLabels}><Text variant="labelMedium" style={styles.progressTitle}>{label}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{progressText(value, unit)}</Text></View>
    <View accessible={exposeProgress} accessibilityRole={exposeProgress ? 'progressbar' : undefined} accessibilityLabel={exposeProgress ? `${label}: ${progressText(value, unit)}` : undefined} accessibilityValue={exposeProgress ? { min: 0, max: 100, now: Math.round(value.fraction * 100) } : undefined} style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}><View style={[styles.fill, { width: `${value.fraction * 100}%`, backgroundColor: color }]} /></View>
  </View>;
}

export function MaintenanceCard({ rule, currentOdometer, onPress }: { rule: MaintenanceRule; currentOdometer: number; onPress?: () => void; index?: number }) {
  const theme = useTheme();
  const model = buildMaintenanceCardModel(rule, currentOdometer, new Date().toISOString());
  const statusColor = model.tracking === 'tracked' ? maintenanceStatusColors(theme.dark)[model.status] : theme.colors.onSurfaceVariant;
  const completionDetails = [
    model.lastCompletedAt ? `${rule.type === 'engine-oil' ? 'Ganti oli terakhir' : 'Perawatan terakhir'}: ${new Date(model.lastCompletedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : undefined,
    model.lastCompletedKm === undefined ? undefined : `Odometer acuan: ${model.lastCompletedKm.toLocaleString('id-ID')} km`,
  ].filter((value) => value !== undefined).join(' / ');
  const summary = model.tracking === 'tracked' ? maintenanceSummary(model.result) : 'Catat perawatan terakhir untuk mulai menghitung';
  const accessibilityLabel = onPress ? [rule.title, summary, model.distance ? `Jarak, ${progressText(model.distance, 'km')}` : undefined, model.time ? `Waktu, ${progressText(model.time, 'hari')}` : undefined, completionDetails || 'Belum ada catatan sebelumnya', 'Buka detail'].filter((value) => value !== undefined).join('. ') : undefined;
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
      <Text variant="bodyMedium" style={styles.detail}>{summary}</Text>
      <View style={[styles.badge, { backgroundColor: model.tracking === 'tracked' ? `${statusColor}15` : theme.colors.surfaceVariant }]}><Text variant="labelMedium" style={{ color: statusColor }}>{model.tracking === 'tracked' ? labels[model.status] : 'Belum tercatat'}</Text></View>
    </View>
    {model.distance ? <ProgressRow label="Jarak" unit="km" value={model.distance} color={statusColor} exposeProgress={!onPress} /> : null}
    {model.time ? <ProgressRow label="Waktu" unit="hari" value={model.time} color={statusColor} exposeProgress={!onPress} /> : null}
    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{completionDetails || 'Belum ada catatan sebelumnya'}</Text>
  </>;
  const cardStyle = [styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.75 : 1 }]}>{content}</Pressable> : <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 }, title: { fontWeight: '700', lineHeight: 23 }, source: { marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  detail: { flexGrow: 1, flexShrink: 1, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  progressBlock: { gap: 8 }, progressLabels: { gap: 4 }, progressTitle: { fontWeight: '700' },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: 5, borderRadius: 3 },
});
