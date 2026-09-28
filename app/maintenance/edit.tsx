import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { DateTimeField } from '@/src/components/DateTimeField';
import { formatIntegerInput, parseIntegerInput } from '@/src/domain/integer-input';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function EditMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === id));
  const update = useAppStore((state) => state.updateMaintenanceRule);
  const [title, setTitle] = useState(rule?.title ?? '');
  const [km, setKm] = useState(formatIntegerInput(rule?.intervalKm?.toString() ?? ''));
  const [lastCompletedKm, setLastCompletedKm] = useState(formatIntegerInput(rule?.lastCompletedKm?.toString() ?? ''));
  const [lastCompletedAt, setLastCompletedAt] = useState(rule?.lastCompletedAt ?? '');
  const [days, setDays] = useState(rule?.intervalDays?.toString() ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const kmValue = parseIntegerInput(km);
  const lastCompletedKmValue = parseIntegerInput(lastCompletedKm);
  const invalidKm = !!km && (kmValue === undefined || !Number.isSafeInteger(kmValue) || kmValue <= 0);
  const invalidLastCompletedKm = !!lastCompletedKm && (lastCompletedKmValue === undefined || !Number.isSafeInteger(lastCompletedKmValue) || lastCompletedKmValue < 0);
  const lastCompletedDate = lastCompletedAt ? new Date(lastCompletedAt).getTime() : undefined;
  const invalidLastCompletedAt = lastCompletedDate !== undefined && (!Number.isFinite(lastCompletedDate) || lastCompletedDate > Date.now());
  const invalidDays = !!days && (!Number.isSafeInteger(Number(days)) || Number(days) <= 0);
  const missingInterval = !km && !days;
  const sectionStyle = [styles.fields, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  const save = () => {
    setSubmitted(true);
    if (!rule || !title.trim() || missingInterval || invalidKm || invalidDays || invalidLastCompletedKm || invalidLastCompletedAt) return;
    try {
      update(rule.id, {
        title: title.trim(),
        intervalKm: kmValue,
        intervalDays: days ? Number(days) : undefined,
        lastCompletedKm: lastCompletedKmValue,
        lastCompletedAt: lastCompletedAt || undefined,
      });
      router.back();
    } catch {
      setError('Jadwal belum tersimpan. Coba lagi.');
    }
  };

  if (!rule) return (
    <Screen>
      <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Jadwal tidak ditemukan.</Text>
      <Button onPress={() => router.back()} contentStyle={styles.button}>Kembali</Button>
    </Screen>
  );

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
          paddingBottom: Math.max(insets.bottom, 24),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }]}>
          <Button icon="arrow-left" onPress={() => router.back()} style={styles.back} contentStyle={styles.button}>Perawatan</Button>
          <View style={styles.heading}>
            <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Edit jadwal</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Sesuaikan interval dengan buku manual dan penggunaan motor Anda.</Text>
          </View>
          <View style={sectionStyle}>
            <TextInput label="Nama perawatan" accessibilityLabel="Nama perawatan" mode="outlined" value={title} onChangeText={setTitle} error={submitted && !title.trim()} />
            {submitted && !title.trim() ? <HelperText type="error">Nama perawatan wajib diisi.</HelperText> : null}
          </View>
          <View style={sectionStyle}>
            <View style={styles.heading}>
              <Text variant="titleMedium">Interval perawatan</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Isi jarak, waktu, atau keduanya. Jadwal mengikuti batas yang tercapai lebih dulu.</Text>
            </View>
            <View>
              <TextInput label="Interval jarak (opsional)" accessibilityLabel="Interval jarak (opsional)" mode="outlined" value={km} onChangeText={(value) => setKm(formatIntegerInput(value))} keyboardType="number-pad" right={<TextInput.Affix text="km" />} error={submitted && invalidKm} />
              {submitted && invalidKm ? <HelperText type="error">Masukkan jarak berupa angka bulat lebih dari 0.</HelperText> : null}
            </View>
            <View>
              <TextInput label="Interval waktu (opsional)" accessibilityLabel="Interval waktu (opsional)" mode="outlined" value={days} onChangeText={setDays} keyboardType="number-pad" right={<TextInput.Affix text="hari" />} error={submitted && invalidDays} />
              {submitted && invalidDays ? <HelperText type="error">Masukkan jumlah hari berupa angka bulat lebih dari 0.</HelperText> : null}
            </View>
            {submitted && missingInterval ? <HelperText type="error">Isi minimal satu interval: jarak atau waktu.</HelperText> : null}
          </View>
          <View style={sectionStyle}>
            <View style={styles.heading}>
              <Text variant="titleMedium">Perawatan terakhir</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Isi jika perawatan ini sudah dilakukan. Data ini menjadi acuan untuk jadwal berikutnya.</Text>
            </View>
            <DateTimeField label="Tanggal terakhir dilakukan (opsional)" value={lastCompletedAt} onChange={setLastCompletedAt} dateOnly optional error={submitted && invalidLastCompletedAt} />
            <View>
              <TextInput label="Odometer saat itu (opsional)" accessibilityLabel="Odometer saat itu (opsional)" mode="outlined" value={lastCompletedKm} onChangeText={(value) => setLastCompletedKm(formatIntegerInput(value))} keyboardType="number-pad" right={<TextInput.Affix text="km" />} error={submitted && invalidLastCompletedKm} />
              {submitted && invalidLastCompletedKm ? <HelperText type="error">Masukkan kilometer berupa angka bulat, minimal 0.</HelperText> : null}
            </View>
            {submitted && invalidLastCompletedAt ? <HelperText type="error">Tanggal perawatan terakhir harus valid dan tidak boleh di masa depan.</HelperText> : null}
          </View>
          {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
          <Button mode="contained" onPress={save} contentStyle={styles.button}>Simpan jadwal</Button>
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
  button: { minHeight: 48 },
});
