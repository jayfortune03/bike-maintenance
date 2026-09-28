import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { SectionTitle } from '@/src/components/SectionTitle';
import { MotorcycleSelector } from '@/src/components/MotorcycleSelector';
import { MotorcyclePickerModal } from '@/src/components/MotorcyclePickerModal';
import { OdometerDialog } from '@/src/components/OdometerDialog';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { buildMaintenanceCardModel } from '@/src/components/maintenance-card-model';
import { selectActiveMotorcycle, useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
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

  if (!motorcycle) return <Screen>
    <View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="motorbike" size={24} color={theme.colors.onPrimaryContainer} /></View><View style={styles.copy}><Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>Motor Care</Text><Text variant="bodyMedium" style={muted}>Rawat motor tanpa lupa.</Text></View></View>
    <View style={surface}><EmptyState title="Mulai dari motor Anda" description="Catat kilometer, jadwal servis, dan pengingat dalam satu tempat." action="Tambah motor pertama" onPress={() => router.push('/motorcycle/add')} /></View>
  </Screen>;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.copy}><Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>Ringkasan</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>Perjalanan nyaman, perawatan terencana.</Text></View>
        <View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="view-dashboard-outline" size={24} color={theme.colors.onPrimaryContainer} /></View>
      </View>
      <MotorcycleSelector motorcycle={motorcycle} onPress={() => setPickerVisible(true)} />
      {oilRule ? <><SectionTitle>Oli mesin</SectionTitle>
        <MaintenanceCard rule={oilRule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${oilRule.id}`)} />
        <View style={styles.oilActions}><Button icon="oil" mode="contained" onPress={() => router.push(`/maintenance/${oilRule.id}?action=log`)} contentStyle={styles.button} style={styles.oilPrimary}>Catat ganti oli</Button><Button icon="tune-variant" mode="outlined" onPress={() => router.push(`/maintenance/edit?id=${oilRule.id}`)} contentStyle={styles.button} style={styles.oilSecondary}>Atur interval</Button></View>
      </> : null}
      <View style={[surface, styles.hero]}>
        <View style={styles.heroTop}><Text variant="labelMedium" style={[muted, styles.eyebrow]}>ODOMETER SAAT INI</Text><MaterialCommunityIcons name="speedometer" size={24} color={theme.colors.primary} /></View>
        <View style={styles.reading}><Text variant="displaySmall" style={styles.odometer}>{motorcycle.currentOdometer.toLocaleString('id-ID')}</Text><Text variant="titleMedium" style={muted}>km</Text></View>
        <Text variant="bodyMedium" style={muted}>Catat kilometer terbaru setelah berkendara.</Text>
        <Button icon="plus" mode="contained" onPress={() => setOdometerVisible(true)} contentStyle={styles.button} style={styles.heroButton}>Update odometer</Button>
      </View>
      <View style={styles.stats}>
        {[{ value: rules.length, label: 'Jadwal aktif' }, { value: attention.length, label: 'Perlu dicek' }, { value: logs.length, label: 'Aktivitas' }].map((item) => <View key={item.label} style={[surface, styles.stat]}><Text variant="headlineSmall" style={styles.title}>{item.value}</Text><Text variant="bodySmall" style={muted}>{item.label}</Text></View>)}
      </View>
      {!attention.length && !untrackedCount ? <View style={[surface, styles.goodCard]}>
        <View style={[styles.goodIcon, { backgroundColor: theme.dark ? '#16342C' : '#ECFDF3' }]}><MaterialCommunityIcons name="check-circle-outline" size={24} color={theme.dark ? '#86EFAC' : '#166534'} /></View>
        <View style={styles.copy}><Text variant="titleSmall" style={styles.title}>Semua terlihat baik</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>Belum ada perawatan yang mendesak.</Text></View>
      </View> : !attention.length && untrackedCount ? <View style={[surface, styles.goodCard]}>
        <View style={[styles.goodIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="clipboard-text-clock-outline" size={24} color={theme.colors.onSurfaceVariant} /></View>
        <View style={styles.copy}><Text variant="titleSmall" style={styles.title}>Lengkapi riwayat perawatan</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>{untrackedCount} jadwal belum memiliki catatan awal.</Text></View>
      </View> : null}
      <SectionTitle>Aksi cepat</SectionTitle>
      <View style={styles.actions}>
        {[
          { label: 'Odometer', icon: 'speedometer' as const, action: () => setOdometerVisible(true) },
          { label: 'Pengingat', icon: 'bell-outline' as const, action: () => router.push('/reminder/create') },
          { label: 'Perawatan', icon: 'wrench-outline' as const, action: () => router.push('/(tabs)/maintenance') },
        ].map((item) => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.action} style={({ pressed }) => [surface, styles.action, { opacity: pressed ? 0.7 : 1 }]}><View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name={item.icon} size={23} color={theme.colors.onPrimaryContainer} /></View><Text variant="labelLarge" style={styles.actionLabel}>{item.label}</Text></Pressable>)}
      </View>
      {otherAttention.length ? <><SectionTitle>Perlu perhatian</SectionTitle>{otherAttention.slice(0, 3).map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />)}<Button onPress={() => router.push('/(tabs)/maintenance')} contentStyle={styles.button}>Lihat semua perawatan</Button></> : null}
      <SectionTitle>Aktivitas terakhir</SectionTitle>
      <View style={surface}>
        {logs.length ? logs.slice(-3).reverse().map((log, index) => <View key={log.id} style={[styles.log, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }]}>
          <View style={[styles.logIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} /></View>
          <View style={styles.copy}><Text variant="bodyMedium" style={styles.title}>{log.title}</Text><Text variant="bodySmall" style={[muted, styles.subtitle]}>{new Date(log.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}{log.odometer !== undefined ? ` / ${log.odometer.toLocaleString('id-ID')} km` : ''}</Text></View>
        </View>) : <><Text variant="titleSmall" style={styles.title}>Belum ada aktivitas</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>Riwayat akan muncul setelah Anda mencatat perawatan pertama.</Text></>}
      </View>
      <MotorcyclePickerModal visible={pickerVisible} motorcycles={motorcycles} activeId={activeId} onSelect={setActive} onAdd={() => router.push('/motorcycle/add')} onDismiss={() => setPickerVisible(false)} />
      <OdometerDialog motorcycle={motorcycle} visible={odometerVisible} onDismiss={() => setOdometerVisible(false)} onSave={(value) => updateOdometer(motorcycle.id, value)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 }, title: { fontWeight: '700' }, subtitle: { marginTop: 4, lineHeight: 21 },
  surface: { borderWidth: 1, borderRadius: 20, padding: 16 },
  oilActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, oilPrimary: { flexGrow: 1 }, oilSecondary: { flexGrow: 1 },
  hero: { marginTop: 16, padding: 20 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { letterSpacing: 1, flexShrink: 1 }, reading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginTop: 16, marginBottom: 8 },
  odometer: { fontWeight: '800', letterSpacing: -1 }, heroButton: { marginTop: 20 }, button: { minHeight: 48 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }, stat: { flex: 1, minWidth: 88, padding: 12, gap: 6, borderRadius: 16 },
  goodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  goodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, action: { flex: 1, minWidth: 88, alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 16, borderRadius: 16 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, actionLabel: { textAlign: 'center', flexShrink: 1 },
  log: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  logIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
