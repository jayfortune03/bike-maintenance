import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { useAppStore, selectActiveMotorcycle } from '@/src/store/app.store';
import { SectionTitle } from '@/src/components/SectionTitle';
import { deleteReminderWithIntegrations } from '@/src/services/reminder-coordinator';

export default function MaintenanceScreen() {
  const router = useRouter();
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const rules = useAppStore((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled));
  const [filter, setFilter] = useState('all');
  const reminders = useAppStore((state) => state.reminders.filter((reminder) => reminder.motorcycleId === state.activeMotorcycleId));
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const filtered = rules.filter((rule) => filter === 'all' || (filter === 'engine' && ['engine-oil', 'gear-oil', 'general-service'].includes(rule.type)) || (filter === 'tires' && rule.type.startsWith('tire')) || (filter === 'brakes' && rule.type.startsWith('brake')) || (filter === 'other' && !['engine-oil', 'gear-oil', 'general-service', 'tire-pressure', 'tire-condition', 'brake', 'brake-fluid'].includes(rule.type)));
  if (!motorcycle) return <Screen><EmptyState title="Tambahkan motor dulu" description="Jadwal perawatan akan muncul setelah motor ditambahkan." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} /></Screen>;
  return <Screen><Text variant="headlineMedium" style={styles.title}>Perawatan</Text><Text variant="bodyMedium" style={styles.subtitle}>{motorcycle.nickname} · {motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}><SegmentedButtons value={filter} onValueChange={setFilter} buttons={[{ value: 'all', label: 'Semua' }, { value: 'engine', label: 'Mesin' }, { value: 'tires', label: 'Ban' }, { value: 'brakes', label: 'Rem' }, { value: 'other', label: 'Lainnya' }]} /></ScrollView>{filtered.length ? filtered.map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />) : <EmptyState title="Belum ada jadwal" description="Tambahkan jadwal custom untuk perawatan lainnya." />}<Button icon="plus" mode="outlined" onPress={() => router.push('/maintenance/custom')} style={styles.add}>Tambah jadwal custom</Button><SectionTitle>Pengingat</SectionTitle>{reminders.length ? reminders.map((reminder) => <Card key={reminder.id} mode="outlined" style={styles.reminder}><Card.Content><Text variant="titleMedium">{reminder.title}</Text><Text variant="bodySmall" style={styles.muted}>{new Date(reminder.scheduledAt).toLocaleString('id-ID')} · {reminder.repeat === 'none' ? 'Sekali' : reminder.repeat}</Text><View style={styles.reminderActions}><Button compact onPress={() => router.push(`/reminder/edit?id=${reminder.id}`)}>Edit</Button><Button compact textColor="#B91C1C" onPress={() => Alert.alert('Hapus pengingat?', reminder.title, [{ text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteReminderWithIntegrations(reminder); deleteReminder(reminder.id); } }])}>Hapus</Button></View></Card.Content></Card>) : <Text variant="bodyMedium" style={styles.muted}>Belum ada pengingat. Buat satu untuk jadwal berikutnya.</Text>}<Button icon="bell-plus-outline" mode="contained" onPress={() => router.push('/reminder/create')} style={styles.add}>Buat pengingat</Button></Screen>;
}

const styles = StyleSheet.create({ title: { fontWeight: '700', marginTop: 8 }, subtitle: { opacity: 0.7, marginTop: 6, marginBottom: 20 }, chips: { marginBottom: 20 }, add: { marginTop: 8, marginBottom: 24 }, reminder: { marginBottom: 10 }, muted: { opacity: 0.65, marginTop: 5 }, reminderActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 } });
