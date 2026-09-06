import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, RadioButton, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import { createReminderWithIntegrations } from '@/src/services/reminder-coordinator';
import type { ReminderRepeat } from '@/src/domain/types';
import { DateTimeField, formatLocalDateTime } from '@/src/components/DateTimeField';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function CreateReminderScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ruleId } = useLocalSearchParams<{ ruleId?: string }>();
  const activeMotorcycleId = useAppStore((state) => state.activeMotorcycleId);
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === ruleId));
  const addReminder = useAppStore((state) => state.addReminder);
  const [title, setTitle] = useState(rule?.title ?? '');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState(formatLocalDateTime(new Date(Date.now() + 86400000)));
  const [repeat, setRepeat] = useState<ReminderRepeat>('none');
  const [notification, setNotification] = useState(true);
  const [calendar, setCalendar] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const invalidDate = !scheduledAt || Number.isNaN(new Date(scheduledAt).getTime());
  const sectionStyle = [styles.fields, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  const save = async () => {
    if (saving || warning) return;
    setSubmitted(true);
    if (!title.trim() || invalidDate) return;
    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const result = await createReminderWithIntegrations({
        id: `${Date.now()}-reminder`,
        title: title.trim(),
        description: description.trim() || undefined,
        motorcycleId: rule?.motorcycleId ?? activeMotorcycleId,
        maintenanceRuleId: ruleId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        repeat,
        notificationEnabled: notification,
        calendarEnabled: calendar,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });
      addReminder(result.reminder);
      setNotification(result.reminder.notificationEnabled);
      setCalendar(result.reminder.calendarEnabled);
      if (result.warning) setWarning(result.warning);
      else router.back();
    } catch {
      setError('Pengingat belum tersimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
          paddingBottom: Math.max(insets.bottom, 24),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }]}>
          <Button icon="arrow-left" onPress={() => router.back()} disabled={saving} style={styles.back}>Pengingat</Button>
          <View style={styles.heading}>
            <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Buat pengingat</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Atur waktu dan cara Anda menerima pengingat di perangkat ini.</Text>
          </View>
          <View style={sectionStyle}>
            <Text variant="titleMedium">Detail pengingat</Text>
            <View>
              <TextInput label="Judul" accessibilityLabel="Judul" mode="outlined" outlineStyle={styles.inputOutline} value={title} onChangeText={setTitle} disabled={saving || !!warning} error={submitted && !title.trim()} placeholder="Contoh: Cek tekanan ban" />
              {submitted && !title.trim() ? <HelperText type="error">Judul wajib diisi.</HelperText> : null}
            </View>
            <View>
              <DateTimeField label="Tanggal dan waktu" value={scheduledAt} onChange={setScheduledAt} disabled={saving || !!warning} error={submitted && invalidDate} />
              {submitted && invalidDate ? <HelperText type="error">Pilih tanggal dan waktu yang valid.</HelperText> : null}
            </View>
            <TextInput label="Catatan (opsional)" accessibilityLabel="Catatan (opsional)" mode="outlined" outlineStyle={styles.inputOutline} value={description} onChangeText={setDescription} disabled={saving || !!warning} multiline numberOfLines={3} style={styles.notes} />
          </View>
          <View style={sectionStyle}>
            <Text variant="titleMedium">Ulangi pengingat</Text>
            <RadioButton.Group value={repeat} onValueChange={(value) => setRepeat(value as ReminderRepeat)}>
              <View style={styles.repeat}>
                {[
                  { value: 'none', label: 'Tidak berulang' },
                  { value: 'daily', label: 'Harian' },
                  { value: 'weekly', label: 'Mingguan' },
                  { value: 'monthly', label: 'Bulanan' },
                  { value: 'yearly', label: 'Tahunan' },
                ].map((item) => (
                  <RadioButton.Item key={item.value} {...item} disabled={saving || !!warning} style={[styles.repeatOption, { backgroundColor: repeat === item.value ? theme.colors.secondaryContainer : theme.colors.surface }]} />
                ))}
              </View>
            </RadioButton.Group>
            {repeat !== 'none' ? <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Notifikasi berulang dimulai pada kecocokan jadwal terdekat, bukan tanggal mulai yang ditunda. Bulanan mendukung tanggal 1-28. Kalender tetap mengikuti tanggal mulai yang dipilih.</Text> : null}
          </View>
          <View style={sectionStyle}>
            <Text variant="titleMedium">Cara mengingatkan</Text>
            <View style={styles.setting}>
              <View style={styles.settingCopy}>
                <Text variant="titleSmall">Notifikasi lokal</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Tampilkan pemberitahuan di perangkat.</Text>
              </View>
              <Switch accessibilityLabel="Notifikasi lokal" value={notification} onValueChange={setNotification} disabled={saving || !!warning} />
            </View>
            <View style={styles.setting}>
              <View style={styles.settingCopy}>
                <Text variant="titleSmall">Tambahkan ke kalender</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Simpan juga sebagai acara kalender.</Text>
              </View>
              <Switch accessibilityLabel="Tambahkan ke kalender" value={calendar} onValueChange={setCalendar} disabled={saving || !!warning} />
            </View>
          </View>
          {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
          {warning ? <HelperText type="info" accessibilityLiveRegion="polite">{warning}</HelperText> : null}
          <Button mode="contained" onPress={warning ? () => router.back() : save} loading={saving} disabled={saving} contentStyle={styles.button}>
            {warning ? 'Selesai' : 'Simpan pengingat'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 20, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  back: { alignSelf: 'flex-start', marginLeft: -8 },
  heading: { gap: 8 },
  title: { fontWeight: '700' },
  fields: { gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  inputOutline: { borderRadius: 12 },
  notes: { minHeight: 112, textAlignVertical: 'top' },
  repeat: { gap: 8 },
  repeatOption: { width: '100%', minHeight: 48, borderRadius: 12 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 64 },
  settingCopy: { flex: 1, gap: 4 },
  button: { minHeight: 48 },
});
