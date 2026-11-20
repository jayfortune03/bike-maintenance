import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { EmptyState } from '@/src/components/EmptyState';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionTitle } from '@/src/components/SectionTitle';
import type { Reminder } from '@/src/domain/types';
import { deleteReminderWithIntegrations } from '@/src/services/reminder-coordinator';
import { selectActiveMotorcycle, useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW, LAYOUT, RADII, SPACING } from '@/src/theme/theme';

const filters = [
  { value: 'all', label: 'Semua' },
  { value: 'engine', label: 'Mesin' },
  { value: 'tires', label: 'Ban' },
  { value: 'brakes', label: 'Rem' },
  { value: 'other', label: 'Lainnya' },
] as const;

type MaintenanceFilter = typeof filters[number]['value'];

const repeatLabels = { none: 'Sekali', daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan', custom: 'Custom' } as const;

export default function MaintenanceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= LAYOUT.wideBreakpoint;
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const rules = useAppStore(useShallow((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled)));
  const reminders = useAppStore(useShallow((state) => state.reminders.filter((reminder) => reminder.motorcycleId === state.activeMotorcycleId)));
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const [filter, setFilter] = useState<MaintenanceFilter>('all');
  const [removing, setRemoving] = useState<Reminder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const filtered = rules.filter((rule) => filter === 'all'
    || (filter === 'engine' && ['engine-oil', 'gear-oil', 'general-service'].includes(rule.type))
    || (filter === 'tires' && rule.type.startsWith('tire'))
    || (filter === 'brakes' && rule.type.startsWith('brake'))
    || (filter === 'other' && !['engine-oil', 'gear-oil', 'general-service', 'tire-pressure', 'tire-condition', 'brake', 'brake-fluid'].includes(rule.type)));
  const selectedFilter = filters.find((item) => item.value === filter)?.label ?? 'Semua';
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const muted = { color: theme.colors.onSurfaceVariant };

  if (!motorcycle) {
    return (
      <Screen>
        <ScreenHeader icon="wrench-clock-outline" title="Perawatan" description="Jadwal servis dan pengingat untuk motor aktif." />
        <View style={surface}>
          <EmptyState icon="motorbike" title="Tambahkan motor dulu" description="Jadwal perawatan akan dibuat setelah profil motor tersedia." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader icon="wrench-clock-outline" title="Perawatan" description="Jadwal servis dan pengingat untuk motor aktif." />
      <View style={[surface, styles.summary]}>
        <View style={[styles.motorIcon, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="motorbike" size={24} color={theme.colors.onPrimaryContainer} />
        </View>
        <View style={styles.copy}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>MOTOR AKTIF</Text>
          <Text variant="titleMedium">{motorcycle.nickname}</Text>
          <Text variant="bodySmall" style={muted}>{motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text>
        </View>
        <View style={styles.counts}>
          <Text variant="titleMedium">{rules.length}</Text>
          <Text variant="bodySmall" style={muted}>jadwal</Text>
        </View>
        <View style={styles.counts}>
          <Text variant="titleMedium">{reminders.length}</Text>
          <Text variant="bodySmall" style={muted}>pengingat</Text>
        </View>
      </View>

      <View style={[styles.contentGrid, wide && styles.contentGridWide]}>
        <View style={styles.mainColumn}>
          <SectionTitle description="Saring berdasarkan bagian motor.">Jadwal perawatan</SectionTitle>
          <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Filter kategori perawatan">
            {filters.map((item) => (
              <Chip
                key={item.value}
                selected={filter === item.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: filter === item.value }}
                onPress={() => setFilter(item.value)}
                style={[styles.chip, { backgroundColor: filter === item.value ? theme.colors.primaryContainer : theme.colors.surface }]}
                textStyle={{ color: filter === item.value ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
              >
                {item.label}
              </Chip>
            ))}
          </View>

          {filtered.length > 0 ? filtered.map((rule) => (
            <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />
          )) : (
            <View style={surface}>
              <EmptyState icon="filter-remove-outline" title={`Belum ada jadwal ${selectedFilter.toLowerCase()}`} description="Tambahkan jadwal custom atau pilih kategori lain." action="Tambah jadwal" onPress={() => router.push('/maintenance/custom')} />
            </View>
          )}

          {filtered.length > 0 ? <Button icon="plus" mode="outlined" onPress={() => router.push('/maintenance/custom')} contentStyle={styles.button}>Tambah jadwal custom</Button> : null}
        </View>

        <View style={styles.railColumn}>
          <SectionTitle description="Notifikasi dan kalender yang kamu atur.">Pengingat</SectionTitle>
          {reminders.length > 0 ? (
            <View style={styles.reminders}>
              {reminders.map((reminder) => (
                <View key={reminder.id} style={surface}>
                  <View style={styles.reminderTop}>
                    <View style={[styles.reminderIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.primary} /></View>
                    <View style={styles.copy}>
                      <Text variant="titleMedium">{reminder.title}</Text>
                      <Text variant="bodySmall" style={[muted, styles.meta]}>{new Date(reminder.scheduledAt).toLocaleString('id-ID')}</Text>
                      <Text variant="bodySmall" style={muted}>{repeatLabels[reminder.repeat]}</Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={[muted, styles.integration]}>{reminder.notificationEnabled ? 'Notifikasi aktif' : 'Notifikasi nonaktif'} / {reminder.calendarEnabled ? 'Kalender aktif' : 'Kalender nonaktif'}</Text>
                  {reminder.integrationWarning ? <HelperText type="error">{reminder.integrationWarning}</HelperText> : null}
                  <View style={styles.actions}>
                    <Button onPress={() => router.push(`/reminder/edit?id=${reminder.id}`)} contentStyle={styles.button}>Edit</Button>
                    <Button textColor={theme.colors.error} onPress={() => { setError(''); setRemoving(reminder); }} contentStyle={styles.button}>Hapus</Button>
                  </View>
                </View>
              ))}
              <Button icon="bell-plus-outline" mode="contained" onPress={() => router.push('/reminder/create')} contentStyle={styles.button}>Buat pengingat</Button>
            </View>
          ) : (
            <View style={surface}>
              <EmptyState icon="bell-plus-outline" title="Belum ada pengingat" description="Buat pengingat untuk servis atau pemeriksaan berikutnya." action="Buat pengingat" onPress={() => router.push('/reminder/create')} />
            </View>
          )}
        </View>
      </View>

      <Portal>
        <Dialog visible={removing !== null} onDismiss={() => { if (!busy) setRemoving(null); }} style={styles.dialog}>
          <Dialog.Title>Hapus pengingat?</Dialog.Title>
          <Dialog.Content>
            <Text>{removing?.title}</Text>
            {error ? <HelperText type="error">{error}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button disabled={busy} onPress={() => setRemoving(null)} contentStyle={styles.button}>Batal</Button>
            <Button loading={busy} disabled={busy} textColor={theme.colors.error} contentStyle={styles.button} onPress={async () => {
              if (!removing || busy) return;
              setBusy(true);
              try {
                await deleteReminderWithIntegrations(removing);
                deleteReminder(removing.id);
                setRemoving(null);
              } catch {
                setError('Pengingat belum terhapus. Coba lagi.');
              } finally {
                setBusy(false);
              }
            }}>Hapus</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg },
  copy: { flex: 1, minWidth: 0 },
  meta: { marginTop: SPACING.xs },
  summary: { minHeight: 104, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.lg, padding: SPACING.xl },
  motorIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  counts: { minWidth: 64, alignItems: 'flex-end' },
  contentGrid: { gap: SPACING.lg },
  contentGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { flex: 1.6, minWidth: 0 },
  railColumn: { flex: 1, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: { minHeight: SPACING.touch, justifyContent: 'center', borderRadius: RADII.control },
  button: { minHeight: SPACING.touch },
  reminders: { gap: SPACING.md },
  reminderTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  reminderIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  integration: { marginTop: SPACING.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: SPACING.sm },
  dialog: { width: '90%', maxWidth: 480, alignSelf: 'center' },
  dialogActions: { flexWrap: 'wrap' },
});
