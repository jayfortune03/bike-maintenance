import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { DateTimeField } from '@/src/components/DateTimeField';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { Sheet } from '@/src/components/Sheet';
import { isBeforeToday } from '@/src/domain/date';
import { formatIntegerInput, parseIntegerInput } from '@/src/domain/integer-input';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function MaintenanceDetailScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === id));
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === rule?.motorcycleId));
  const complete = useAppStore((state) => state.completeMaintenance);
  const [visible, setVisible] = useState(action === 'log');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString());
  const [odometer, setOdometer] = useState(motorcycle ? formatIntegerInput(String(motorcycle.currentOdometer)) : '');
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [confirmCorrection, setConfirmCorrection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const save = async () => {
    if (!rule || !motorcycle || saving) return;
    const completedAtMs = new Date(completedAt).getTime();
    if (!Number.isFinite(completedAtMs) || completedAtMs > Date.now()) {
      setDateError('Tanggal perawatan harus valid dan tidak boleh di masa depan.');
      return;
    }
    setDateError('');
    const value = parseIntegerInput(odometer);
    if (rule.intervalKm && value === undefined) {
      setError('Odometer wajib diisi agar sisa jarak dapat dihitung dari perawatan ini.');
      return;
    }
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
      setError('Masukkan kilometer berupa angka bulat, minimal 0.');
      return;
    }
    if (value !== undefined && value < motorcycle.currentOdometer && !isBeforeToday(completedAt) && !confirmCorrection) {
      setConfirmCorrection(true);
      return;
    }
    setSaving(true);
    try {
      const warning = await complete(rule.id, { completedAt, odometer: value });
      setNotice(warning ?? 'Perawatan berhasil dicatat.');
      setVisible(false);
    } catch {
      setError('Perawatan belum tersimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (!rule || !motorcycle) return (
    <Screen>
      <Text variant="titleMedium">Jadwal tidak ditemukan.</Text>
      <Button onPress={() => router.back()}>Kembali</Button>
    </Screen>
  );

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={[styles.content, {
        paddingBottom: Math.max(insets.bottom, 24),
        paddingLeft: Math.max(insets.left, 20),
        paddingRight: Math.max(insets.right, 20),
      }]}>
        <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Perawatan</Button>
        <View style={styles.heading}>
          <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>{rule.title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.nickname}</Text>
        </View>
        {notice ? <HelperText type="info" accessibilityLiveRegion="polite">{notice}</HelperText> : null}
        <MaintenanceCard rule={rule} currentOdometer={motorcycle.currentOdometer} />
        <Card mode="outlined" style={[styles.info, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <Card.Content style={styles.infoContent}>
            <Text variant="titleMedium">Tentang jadwal ini</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              {rule.description ?? 'Jadwal ini adalah saran umum. Periksa buku manual motor Anda untuk interval yang tepat.'}
            </Text>
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{rule.sourceLabel}</Text>
            <View style={styles.intervals}>
              {rule.intervalKm ? <Text variant="bodyLarge">Setiap {rule.intervalKm.toLocaleString('id-ID')} km</Text> : null}
              {rule.intervalDays ? <Text variant="bodyLarge">{rule.intervalKm ? 'atau setiap' : 'Setiap'} {rule.intervalDays} hari</Text> : null}
            </View>
          </Card.Content>
        </Card>
        <View style={styles.buttons}>
          <Button mode="contained" contentStyle={styles.button} onPress={() => {
            setCompletedAt(new Date().toISOString());
            setOdometer(formatIntegerInput(String(motorcycle.currentOdometer)));
            setError('');
            setDateError('');
            setConfirmCorrection(false);
            setVisible(true);
          }}>Tandai selesai</Button>
          <Button mode="outlined" contentStyle={styles.button} onPress={() => router.push(`/reminder/create?ruleId=${rule.id}`)}>Buat pengingat</Button>
          <Button mode="text" contentStyle={styles.button} onPress={() => router.push(`/maintenance/edit?id=${rule.id}`)}>Edit jadwal</Button>
        </View>
        <Sheet visible={visible} onDismiss={() => { if (!saving) setVisible(false); }}>
          <View style={styles.sheetHeading}>
            <Text variant="titleLarge" accessibilityRole="header" style={styles.sheetTitle}>Catat perawatan</Text>
            <IconButton disabled={saving} icon="close" accessibilityLabel="Tutup catatan perawatan" onPress={() => setVisible(false)} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Text variant="bodyMedium">Simpan riwayat untuk {rule.title}. {rule.intervalKm ? 'Odometer diperlukan untuk menghitung sisa jarak.' : 'Odometer motor juga akan diperbarui jika diisi.'}</Text>
            <View>
              <DateTimeField label="Tanggal perawatan" value={completedAt} onChange={(value) => { setCompletedAt(value); setDateError(''); setConfirmCorrection(false); }} disabled={saving} dateOnly error={!!dateError} />
              {dateError ? <HelperText type="error" accessibilityLiveRegion="polite">{dateError}</HelperText> : null}
            </View>
            <View>
              <TextInput
                label={rule.intervalKm ? 'Odometer' : 'Odometer (opsional)'}
                accessibilityLabel={rule.intervalKm ? 'Odometer' : 'Odometer (opsional)'}
                mode="outlined"
                value={odometer}
                disabled={saving}
                onChangeText={(value) => { setOdometer(formatIntegerInput(value)); setError(''); setConfirmCorrection(false); }}
                keyboardType="number-pad"
                error={!!error}
                right={<TextInput.Affix text="km" />}
              />
              {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
              <HelperText type="info">{isBeforeToday(completedAt) ? 'Masukkan odometer saat perawatan dilakukan.' : `Odometer motor saat ini: ${motorcycle.currentOdometer.toLocaleString('id-ID')} km.`}</HelperText>
            </View>
            {confirmCorrection ? (
              <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>
                Angka ini lebih kecil dari odometer terakhir. Menyimpan akan mengoreksi odometer motor Anda.
              </Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Button disabled={saving} loading={saving} mode="contained" contentStyle={styles.button} onPress={save}>{confirmCorrection ? 'Simpan dan koreksi odometer' : 'Simpan perawatan'}</Button>
              <Button disabled={saving} contentStyle={styles.button} onPress={() => setVisible(false)}>Batal</Button>
            </View>
          </ScrollView>
        </Sheet>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  back: { alignSelf: 'flex-start', marginLeft: -8 },
  heading: { gap: 8, marginVertical: 24 },
  title: { fontWeight: '700' },
  info: { marginTop: 12, borderRadius: 20 },
  infoContent: { padding: 20, gap: 16 },
  infoText: { lineHeight: 24 },
  intervals: { gap: 8 },
  buttons: { gap: 16, marginTop: 24 },
  button: { minHeight: 48 },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 24, paddingRight: 8, paddingVertical: 16 },
  sheetTitle: { flex: 1, fontWeight: '700' },
  sheetContent: { paddingHorizontal: 24, gap: 24 },
  modalButtons: { gap: 16 },
});
