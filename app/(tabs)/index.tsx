import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { EmptyState } from '@/src/components/EmptyState';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { MotorcyclePickerModal } from '@/src/components/MotorcyclePickerModal';
import { MotorcycleSelector } from '@/src/components/MotorcycleSelector';
import { OdometerDialog } from '@/src/components/OdometerDialog';
import { OilReminderControl } from '@/src/components/OilReminderControl';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionTitle } from '@/src/components/SectionTitle';
import { SportMotorcyclePreview } from '@/src/components/SportMotorcyclePreview';
import { buildMaintenanceCardModel } from '@/src/components/maintenance-card-model';
import { selectActiveMotorcycle, useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW, LAYOUT, RADII, SPACING } from '@/src/theme/theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= LAYOUT.wideBreakpoint;
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const rules = useAppStore(useShallow((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled)));
  const logs = useAppStore(useShallow((state) => state.maintenanceLogs.filter((log) => log.motorcycleId === state.activeMotorcycleId)));
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  const updateOdometer = useAppStore((state) => state.updateOdometer);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [odometerVisible, setOdometerVisible] = useState(false);
  const currentDate = new Date().toISOString();
  const attention = rules.filter((rule) => {
    const model = buildMaintenanceCardModel(rule, motorcycle?.currentOdometer ?? 0, currentDate);
    return model.tracking === 'tracked' && model.status !== 'good';
  });
  const untrackedCount = rules.filter((rule) => buildMaintenanceCardModel(rule, motorcycle?.currentOdometer ?? 0, currentDate).tracking === 'untracked').length;
  const oilRule = rules.find((rule) => rule.type === 'engine-oil');
  const otherAttention = attention.filter((rule) => rule.type !== 'engine-oil');
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const muted = { color: theme.colors.onSurfaceVariant };

  if (!motorcycle) {
    return (
      <Screen>
        <ScreenHeader icon="motorbike" title="Motor Care" description="Catatan perawatan yang mudah dibaca." />
        <View style={surface}>
          <EmptyState
            title="Tambahkan motor pertama"
            description="Setelah itu, kamu bisa mencatat kilometer, jadwal servis, dan pengingat di satu tempat."
            action="Tambah motor"
            onPress={() => router.push('/motorcycle/add')}
          />
        </View>
      </Screen>
    );
  }

  const health = attention.length > 0
    ? { icon: 'alert-circle-outline' as const, title: `${attention.length} perawatan perlu dicek`, detail: 'Buka detail untuk melihat batas jarak atau waktunya.' }
    : untrackedCount > 0
      ? { icon: 'clipboard-text-clock-outline' as const, title: 'Lengkapi riwayat perawatan', detail: `${untrackedCount} jadwal belum memiliki catatan awal.` }
      : { icon: 'check-circle-outline' as const, title: 'Tidak ada jadwal mendesak', detail: 'Semua jadwal yang terlacak masih dalam batas.' };

  return (
    <Screen>
      <ScreenHeader icon="view-dashboard-outline" title="Ringkasan" description="Lihat yang perlu dilakukan sebelum berkendara lagi." />
      <MotorcycleSelector motorcycle={motorcycle} onPress={() => setPickerVisible(true)} />

      <SectionTitle description="Selesaikan atau atur pengingatnya dari sini.">Prioritas berikutnya</SectionTitle>
      {oilRule ? (
        <View style={styles.oilStack}>
          <MaintenanceCard rule={oilRule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${oilRule.id}`)} />
          <Button icon="oil" mode="contained" onPress={() => router.push(`/maintenance/${oilRule.id}?action=log`)} contentStyle={styles.button}>Catat ganti oli</Button>
          <OilReminderControl ruleId={oilRule.id} />
          <Button icon="tune-variant" mode="outlined" onPress={() => router.push(`/maintenance/edit?id=${oilRule.id}`)} contentStyle={styles.button}>Atur interval</Button>
        </View>
      ) : (
        <View style={surface}>
          <EmptyState icon="oil" title="Jadwal oli belum ada" description="Form berikut membuat jadwal perawatan custom, bukan jadwal oli bawaan." action="Tambah jadwal perawatan" onPress={() => router.push('/maintenance/custom')} />
        </View>
      )}

      {motorcycle.type === 'sport' ? (
        <>
          <SectionTitle>Motor sport kamu</SectionTitle>
          <SportMotorcyclePreview color={motorcycle.themeColor} />
        </>
      ) : null}

      <View style={[styles.dashboardGrid, wide && styles.dashboardGridWide]}>
        <View style={[surface, styles.odometerCard]}>
          <View style={styles.cardHeading}>
            <View style={styles.cardHeadingCopy}>
              <Text variant="labelMedium" style={[muted, styles.eyebrow]}>ODOMETER SAAT INI</Text>
              <View style={styles.reading}>
                <Text variant="displaySmall" style={styles.odometerValue}>{motorcycle.currentOdometer.toLocaleString('id-ID')}</Text>
                <Text variant="titleMedium" style={muted}>km</Text>
              </View>
            </View>
            <View style={[styles.largeIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="speedometer" size={28} color={theme.colors.onPrimaryContainer} />
            </View>
          </View>
          <Text variant="bodyMedium" style={muted}>Perbarui setelah berkendara agar jadwal berbasis kilometer tetap akurat.</Text>
          <Button icon="plus" mode="contained" onPress={() => setOdometerVisible(true)} contentStyle={styles.button} style={styles.odometerButton}>Update odometer</Button>
        </View>

        <View style={styles.rail}>
          <View style={[surface, styles.healthCard]}>
            <View style={[styles.statusIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name={health.icon} size={24} color={attention.length ? theme.colors.tertiary : theme.colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text variant="titleSmall">{health.title}</Text>
              <Text variant="bodySmall" style={[muted, styles.meta]}>{health.detail}</Text>
            </View>
          </View>
          <View style={[surface, styles.stats]}>
            {[
              { value: rules.length, label: 'Jadwal aktif' },
              { value: attention.length, label: 'Perlu dicek' },
              { value: logs.length, label: 'Aktivitas' },
            ].map((item, index) => (
              <View key={item.label} style={[styles.stat, index > 0 && { borderTopColor: theme.colors.outlineVariant, borderTopWidth: 1 }]}>
                <Text variant="titleLarge">{item.value}</Text>
                <Text variant="bodySmall" style={muted}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <SectionTitle>Aksi cepat</SectionTitle>
      <View style={styles.quickActions}>
        {[
          { label: 'Odometer', icon: 'speedometer' as const, action: () => setOdometerVisible(true) },
          { label: 'Pengingat', icon: 'bell-outline' as const, action: () => router.push('/reminder/create') },
          { label: 'Perawatan', icon: 'wrench-outline' as const, action: () => router.push('/(tabs)/maintenance') },
        ].map((item) => (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.action} style={({ pressed }) => [surface, styles.quickAction, { opacity: pressed ? 0.72 : 1 }]}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.onPrimaryContainer} /></View>
            <Text variant="labelLarge" style={styles.actionLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {otherAttention.length > 0 ? (
        <>
          <SectionTitle action="Lihat semua" onAction={() => router.push('/(tabs)/maintenance')}>Perlu perhatian</SectionTitle>
          {otherAttention.slice(0, 3).map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />)}
        </>
      ) : null}

      <SectionTitle>Aktivitas terakhir</SectionTitle>
      <View style={surface}>
        {logs.length > 0 ? logs.slice(-3).reverse().map((log, index) => (
          <View key={log.id} style={[styles.log, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }]}>
            <View style={[styles.logIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} /></View>
            <View style={styles.copy}>
              <Text variant="bodyMedium">{log.title}</Text>
              <Text variant="bodySmall" style={[muted, styles.meta]}>{new Date(log.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}{log.odometer !== undefined ? ` / ${log.odometer.toLocaleString('id-ID')} km` : ''}</Text>
            </View>
          </View>
        )) : <EmptyState icon="history" title="Belum ada aktivitas" description="Riwayat akan muncul setelah kamu mencatat perawatan pertama." />}
      </View>

      <MotorcyclePickerModal visible={pickerVisible} motorcycles={motorcycles} activeId={activeId} onSelect={setActive} onAdd={() => router.push('/motorcycle/add')} onDismiss={() => setPickerVisible(false)} />
      <OdometerDialog motorcycle={motorcycle} visible={odometerVisible} onDismiss={() => setOdometerVisible(false)} onSave={(value) => updateOdometer(motorcycle.id, value)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg },
  copy: { flex: 1, minWidth: 0 },
  meta: { marginTop: SPACING.xs },
  oilStack: { gap: SPACING.md },
  button: { minHeight: SPACING.touch },
  dashboardGrid: { gap: SPACING.lg, marginTop: SPACING.xxl },
  dashboardGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  odometerCard: { flex: 2, padding: SPACING.xxl, borderRadius: RADII.featured },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.lg },
  cardHeadingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { letterSpacing: 1 },
  reading: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.sm },
  odometerValue: { flexShrink: 1 },
  largeIcon: { flexShrink: 0, width: 56, height: 56, borderRadius: RADII.compact, alignItems: 'center', justifyContent: 'center' },
  odometerButton: { marginTop: SPACING.xl, alignSelf: 'flex-start' },
  rail: { flex: 1, minWidth: 0, gap: SPACING.md },
  healthCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  statusIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  stats: { paddingVertical: 0 },
  stat: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md, paddingVertical: SPACING.md },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  quickAction: { flex: 1, minWidth: 96, minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADII.compact },
  actionIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { textAlign: 'center', flexShrink: 1 },
  log: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  logIcon: { width: 36, height: 36, borderRadius: RADII.badge, alignItems: 'center', justifyContent: 'center' },
});
