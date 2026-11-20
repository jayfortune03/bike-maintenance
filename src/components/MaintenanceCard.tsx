import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import type { MaintenanceRule, MaintenanceStatus } from '@/src/domain/types';
import { maintenanceSummary } from '@/src/domain/maintenance-summary';
import { buildMaintenanceCardModel, type MaintenanceProgress } from '@/src/components/maintenance-card-model';
import { CARD_SHADOW, RADII, SPACING, maintenanceStatusColors } from '@/src/theme/theme';

const labels: Record<MaintenanceStatus, string> = {
  good: 'Aman',
  soon: 'Segera',
  due: 'Sudah waktunya',
  overdue: 'Terlambat',
};
const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'engine-oil': 'oil',
  'gear-oil': 'cog-outline',
  'tire-pressure': 'tire',
  'tire-condition': 'tire',
  brake: 'car-brake-alert',
  'brake-fluid': 'car-brake-alert',
  battery: 'car-battery',
  'general-service': 'wrench-outline',
};
const statusIcons: Record<MaintenanceStatus, keyof typeof MaterialCommunityIcons.glyphMap> = {
  good: 'check-circle-outline',
  soon: 'clock-alert-outline',
  due: 'alert-circle-outline',
  overdue: 'alert-octagon-outline',
};

type ProgressRowProps = {
  readonly label: string;
  readonly unit: string;
  readonly value: MaintenanceProgress;
  readonly color: string;
  readonly exposeProgress: boolean;
};

type MaintenanceCardProps = {
  readonly rule: MaintenanceRule;
  readonly currentOdometer: number;
  readonly onPress?: () => void;
  readonly index?: number;
};

function progressText(value: MaintenanceProgress, unit: string): string {
  const used = `${value.used.toLocaleString('id-ID')} ${unit}`;
  const remaining = value.overdue > 0
    ? `Lewat ${value.overdue.toLocaleString('id-ID')} ${unit}`
    : `Tersisa ${value.remaining.toLocaleString('id-ID')} ${unit}`;
  return `Terpakai ${used} · ${remaining}`;
}

function ProgressRow({ label, unit, value, color, exposeProgress }: ProgressRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressLabels}>
        <Text variant="labelMedium" style={styles.progressTitle}>{label}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{progressText(value, unit)}</Text>
      </View>
      <View
        accessible={exposeProgress}
        accessibilityRole={exposeProgress ? 'progressbar' : undefined}
        accessibilityLabel={exposeProgress ? `${label}: ${progressText(value, unit)}` : undefined}
        accessibilityValue={exposeProgress ? { min: 0, max: 100, now: Math.round(value.fraction * 100) } : undefined}
        style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={[styles.fill, { width: `${value.fraction * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MaintenanceCard({ rule, currentOdometer, onPress }: MaintenanceCardProps) {
  const theme = useTheme();
  const model = buildMaintenanceCardModel(rule, currentOdometer, new Date().toISOString());
  const statusColor = model.tracking === 'tracked'
    ? maintenanceStatusColors(theme.dark)[model.status]
    : theme.colors.onSurfaceVariant;
  const needsAttention = model.tracking === 'tracked' && (model.status === 'due' || model.status === 'overdue');
  const attentionContainer = `${statusColor}15`;
  const surfaceColor = needsAttention ? attentionContainer : theme.colors.surface;
  const iconColor = needsAttention ? statusColor : theme.colors.onSurfaceVariant;
  const badgeColor = needsAttention
    ? theme.colors.surface
    : model.tracking === 'tracked'
      ? attentionContainer
      : theme.colors.surfaceVariant;
  const statusIcon = model.tracking === 'tracked' ? statusIcons[model.status] : 'history';
  const completionDetails = [
    model.lastCompletedAt
      ? `${rule.type === 'engine-oil' ? 'Ganti oli terakhir' : 'Perawatan terakhir'}: ${new Date(model.lastCompletedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : undefined,
    model.lastCompletedKm === undefined
      ? undefined
      : `Odometer acuan: ${model.lastCompletedKm.toLocaleString('id-ID')} km`,
  ]
    .filter((value) => value !== undefined)
    .join(' / ');
  const summary = model.tracking === 'tracked'
    ? maintenanceSummary(model.result)
    : 'Catat perawatan terakhir untuk mulai menghitung';
  const accessibilityLabel = onPress
    ? [
        rule.title,
        summary,
        model.distance ? `Jarak, ${progressText(model.distance, 'km')}` : undefined,
        model.time ? `Waktu, ${progressText(model.time, 'hari')}` : undefined,
        completionDetails || 'Belum ada catatan sebelumnya',
        'Buka detail',
      ]
        .filter((value) => value !== undefined)
        .join('. ')
    : undefined;
  const content = (
    <>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: needsAttention ? attentionContainer : theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons
            name={icons[rule.type] ?? 'wrench-outline'}
            size={22}
            color={iconColor}
          />
        </View>
        <View style={styles.copy}>
          <Text variant="titleMedium" style={styles.title}>{rule.title}</Text>
          {rule.sourceLabel ? (
            <Text variant="bodySmall" style={[styles.source, { color: theme.colors.onSurfaceVariant }]}>
              {rule.sourceLabel}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        ) : null}
      </View>
      <View style={styles.statusRow}>
        <Text variant="bodyMedium" style={[styles.detail, needsAttention ? { color: statusColor } : undefined]}>{summary}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <MaterialCommunityIcons
            accessibilityElementsHidden
            importantForAccessibility="no"
            name={statusIcon}
            size={16}
            color={statusColor}
          />
          <Text variant="labelMedium" style={{ color: statusColor }}>
            {model.tracking === 'tracked' ? labels[model.status] : 'Belum tercatat'}
          </Text>
        </View>
      </View>
      {model.distance ? (
        <ProgressRow label="Jarak" unit="km" value={model.distance} color={statusColor} exposeProgress={!onPress} />
      ) : null}
      {model.time ? (
        <ProgressRow label="Waktu" unit="hari" value={model.time} color={statusColor} exposeProgress={!onPress} />
      ) : null}
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {completionDetails || 'Belum ada catatan sebelumnya'}
      </Text>
    </>
  );
  const cardStyle = [styles.card, CARD_SHADOW, { backgroundColor: surfaceColor, borderColor: theme.colors.outlineVariant }];

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.82 : 1 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={cardStyle}>{content}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: {
    width: SPACING.touch,
    height: SPACING.touch,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { lineHeight: 24 },
  source: { marginTop: SPACING.xs },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm },
  detail: { flexGrow: 1, flexShrink: 1, fontWeight: '600' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: RADII.badge,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  progressBlock: { gap: SPACING.sm },
  progressLabels: { gap: SPACING.xs },
  progressTitle: { fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
