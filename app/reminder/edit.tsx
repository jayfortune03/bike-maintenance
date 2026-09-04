import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Switch, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import { updateReminderWithIntegrations } from '@/src/services/reminder-coordinator';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const reminder = useAppStore((state) => state.reminders.find((item) => item.id === id));
  const update = useAppStore((state) => state.updateReminder);
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(reminder?.scheduledAt.slice(0, 16) ?? '');
  const [notification, setNotification] = useState(reminder?.notificationEnabled ?? true);
  const [calendar, setCalendar] = useState(reminder?.calendarEnabled ?? false);
  if (!reminder) return <Screen><Text>Pengingat tidak ditemukan.</Text></Screen>;
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Pengingat</Button><Text variant="headlineMedium" style={styles.title}>Edit pengingat</Text><TextInput label="Judul" mode="outlined" value={title} onChangeText={setTitle} style={styles.input} /><TextInput label="Tanggal dan waktu" mode="outlined" value={scheduledAt} onChangeText={setScheduledAt} style={styles.input} /><Button contentStyle={styles.setting} onPress={() => setNotification(!notification)}>Notifikasi lokal<Switch value={notification} onValueChange={setNotification} /></Button><Button contentStyle={styles.setting} onPress={() => setCalendar(!calendar)}>Kalender<Switch value={calendar} onValueChange={setCalendar} /></Button><Button mode="contained" onPress={async () => { const next = await updateReminderWithIntegrations(reminder, { title: title.trim(), scheduledAt: new Date(scheduledAt).toISOString(), notificationEnabled: notification, calendarEnabled: calendar }); update(reminder.id, next); router.back(); }} style={styles.save}>Simpan perubahan</Button></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 24 }, input: { marginTop: 18 }, setting: { justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 0 }, save: { marginTop: 20 } });
