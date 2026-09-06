import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { useAppStore, selectActiveMotorcycle } from '@/src/store/app.store';
import { SectionTitle } from '@/src/components/SectionTitle';
import { deleteReminderWithIntegrations } from '@/src/services/reminder-coordinator';
import { CARD_SHADOW } from '@/src/theme/theme';
import type { Reminder } from '@/src/domain/types';

const filters = [{ value: 'all', label: 'Semua' }, { value: 'engine', label: 'Mesin' }, { value: 'tires', label: 'Ban' }, { value: 'brakes', label: 'Rem' }, { value: 'other', label: 'Lainnya' }];

export default function MaintenanceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const rules = useAppStore(useShallow((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled)));
  const reminders = useAppStore(useShallow((state) => state.reminders.filter((reminder) => reminder.motorcycleId === state.activeMotorcycleId)));
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const [filter, setFilter] = useState('all');
  const [removing, setRemoving] = useState<Reminder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const filtered = rules.filter((rule) => filter === 'all' || (filter === 'engine' && ['engine-oil', 'gear-oil', 'general-service'].includes(rule.type)) || (filter === 'tires' && rule.type.startsWith('tire')) || (filter === 'brakes' && rule.type.startsWith('brake')) || (filter === 'other' && !['engine-oil', 'gear-oil', 'general-service', 'tire-pressure', 'tire-condition', 'brake', 'brake-fluid'].includes(rule.type)));
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const muted = { color: theme.colors.onSurfaceVariant };

  if (!motorcycle) return <Screen><EmptyState title="Tambahkan motor dulu" description="Jadwal perawatan akan muncul setelah motor ditambahkan." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} /></Screen>;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="wrench-clock-outline" size={24} color={theme.colors.onPrimaryContainer} /></View>
        <View style={styles.copy}><Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>Perawatan</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>Jaga motor tetap siap diajak jalan.</Text></View>
      </View>
      <View style={[surface, styles.summary]}>
        <View style={styles.copy}><Text variant="labelSmall" style={muted}>MOTOR AKTIF</Text><Text variant="titleMedium" style={styles.title}>{motorcycle.nickname}</Text></View>
        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{rules.length} jadwal</Text>
      </View>
      <SectionTitle>Jadwal perawatan</SectionTitle>
      <View style={styles.filters} accessibilityLabel="Filter kategori perawatan">
        {filters.map((item) => <Chip key={item.value} selected={filter === item.value} showSelectedCheck={false} accessibilityState={{ selected: filter === item.value }} onPress={() => setFilter(item.value)} style={[styles.chip, { backgroundColor: filter === item.value ? theme.colors.primaryContainer : theme.colors.surface }]} textStyle={{ color: filter === item.value ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{item.label}</Chip>)}
      </View>
      {filtered.length ? filtered.map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />) : <View style={surface}><EmptyState title="Belum ada jadwal" description="Tambahkan jadwal untuk kategori perawatan ini." /></View>}
      <Button icon="plus" mode="outlined" onPress={() => router.push('/maintenance/custom')} contentStyle={styles.button}>Tambah jadwal custom</Button>
      <SectionTitle>Pengingat</SectionTitle>
      <View style={styles.reminders}>
        {reminders.length ? reminders.map((reminder) => <View key={reminder.id} style={surface}>
          <View style={styles.reminderTop}><MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.primary} /><View style={styles.copy}><Text variant="titleMedium" style={styles.title}>{reminder.title}</Text><Text variant="bodySmall" style={[muted, styles.subtitle]}>{new Date(reminder.scheduledAt).toLocaleString('id-ID')}</Text><Text variant="bodySmall" style={muted}>{({ none: 'Sekali', daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan', custom: 'Custom' })[reminder.repeat]}</Text></View></View>
          <Text variant="bodySmall" style={muted}>{reminder.notificationEnabled ? 'Notifikasi aktif' : 'Notifikasi nonaktif'} / {reminder.calendarEnabled ? 'Kalender aktif' : 'Kalender nonaktif'}</Text>
          {reminder.integrationWarning ? <HelperText type="error">{reminder.integrationWarning}</HelperText> : null}
          <View style={styles.actions}><Button onPress={() => router.push(`/reminder/edit?id=${reminder.id}`)} contentStyle={styles.button}>Edit</Button><Button textColor={theme.colors.error} onPress={() => { setError(''); setRemoving(reminder); }} contentStyle={styles.button}>Hapus</Button></View>
        </View>) : <View style={surface}><Text variant="titleSmall">Tidak ada pengingat</Text><Text variant="bodyMedium" style={[muted, styles.subtitle]}>Buat pengingat untuk servis atau pemeriksaan berikutnya.</Text></View>}
      </View>
      <Button icon="bell-plus-outline" mode="contained" onPress={() => router.push('/reminder/create')} contentStyle={styles.button}>Buat pengingat</Button>
      <Portal><Dialog visible={!!removing} onDismiss={() => { if (!busy) setRemoving(null); }}><Dialog.Title>Hapus pengingat?</Dialog.Title><Dialog.Content><Text>{removing?.title}</Text>{error ? <HelperText type="error">{error}</HelperText> : null}</Dialog.Content><Dialog.Actions><Button disabled={busy} onPress={() => setRemoving(null)}>Batal</Button><Button loading={busy} disabled={busy} textColor={theme.colors.error} onPress={async () => {
        if (!removing || busy) return;
        setBusy(true);
        try { await deleteReminderWithIntegrations(removing); deleteReminder(removing.id); setRemoving(null); } catch { setError('Pengingat belum terhapus. Coba lagi.'); } finally { setBusy(false); }
      }}>Hapus</Button></Dialog.Actions></Dialog></Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 }, title: { fontWeight: '700' }, subtitle: { marginTop: 4, lineHeight: 21 },
  surface: { borderWidth: 1, borderRadius: 20, padding: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, chip: { minHeight: 44, justifyContent: 'center', borderRadius: 12 },
  button: { minHeight: 48 }, reminders: { gap: 12, marginBottom: 16 },
  reminderTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
});
