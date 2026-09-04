import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import { createReminderWithIntegrations } from '@/src/services/reminder-coordinator';
import type { ReminderRepeat } from '@/src/domain/types';

export default function CreateReminderScreen() {
  const router = useRouter();
  const { ruleId } = useLocalSearchParams<{ ruleId?: string }>();
  const motorcycleId = useAppStore((state) => state.activeMotorcycleId);
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === ruleId));
  const addReminder = useAppStore((state) => state.addReminder);
  const [title, setTitle] = useState(rule?.title ?? '');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [repeat, setRepeat] = useState<ReminderRepeat>('none');
  const [notification, setNotification] = useState(true);
  const [calendar, setCalendar] = useState(false);
  const save = async () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const reminder = { id: `${Date.now()}-reminder`, title: title.trim(), description: description.trim() || undefined, motorcycleId, maintenanceRuleId: ruleId, scheduledAt: new Date(scheduledAt).toISOString(), repeat, notificationEnabled: notification, calendarEnabled: calendar, completed: false, createdAt: now, updatedAt: now };
    const result = await createReminderWithIntegrations(reminder);
    addReminder(result.reminder);
    if (result.warning) Alert.alert('Pengingat tersimpan', result.warning);
    router.back();
  };
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Pengingat</Button><Text variant="headlineMedium" style={styles.title}>Buat pengingat</Text><Text variant="bodyMedium" style={styles.copy}>Simpan pengingat di perangkat Anda.</Text><TextInput label="Judul" mode="outlined" value={title} onChangeText={setTitle} placeholder="Contoh: Cek tekanan ban" style={styles.input} /><TextInput label="Tanggal dan waktu" mode="outlined" value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-09-05T09:00" style={styles.input} /><Text variant="labelLarge" style={styles.label}>Ulangi</Text><SegmentedButtons value={repeat} onValueChange={(value) => setRepeat(value as ReminderRepeat)} buttons={[{ value: 'none', label: 'Tidak' }, { value: 'daily', label: 'Harian' }, { value: 'weekly', label: 'Mingguan' }, { value: 'monthly', label: 'Bulanan' }]} /><TextInput label="Catatan (opsional)" mode="outlined" value={description} onChangeText={setDescription} multiline style={styles.input} /><SettingRow label="Notifikasi lokal" value={notification} onChange={setNotification} /><SettingRow label="Tambahkan ke kalender" value={calendar} onChange={setCalendar} /><Button mode="contained" onPress={save} style={styles.save}>Simpan pengingat</Button></Screen>;
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <Button contentStyle={styles.setting} onPress={() => onChange(!value)}>{label}<Switch value={value} onValueChange={onChange} /></Button>; }

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 24 }, copy: { marginTop: 8, opacity: 0.7 }, input: { marginTop: 18 }, label: { marginTop: 24, marginBottom: 10 }, setting: { justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 0 }, save: { marginTop: 20 } });
