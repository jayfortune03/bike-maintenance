import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, ProgressBar, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { MotorcycleColorPicker } from '@/src/components/MotorcycleColorPicker';
import { MotorcyclePhotoPicker } from '@/src/components/MotorcyclePhotoPicker';
import { MOTORCYCLE_COLORS, type MotorcycleColor } from '@/src/data/motorcycle-colors';
import { useAppStore } from '@/src/store/app.store';
import { formatIntegerInput, parseIntegerInput } from '@/src/domain/integer-input';
import type { MotorcycleType } from '@/src/domain/types';
import { persistMotorcyclePhoto, removeMotorcyclePhoto } from '@/src/services/motorcycle-photo';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function AddMotorcycleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const addMotorcycle = useAppStore((state) => state.addMotorcycle);
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<MotorcycleType>('scooter');
  const [odometer, setOdometer] = useState('0');
  const [color, setColor] = useState<MotorcycleColor>(MOTORCYCLE_COLORS[0]);
  const [photoUri, setPhotoUri] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const odometerValue = parseIntegerInput(odometer);
  const suggestedNickname = nickname.trim() || model.trim();
  const invalidYear = !!year && !/^\d{4}$/.test(year.trim());
  const invalidOdometer = odometerValue === undefined || !Number.isSafeInteger(odometerValue) || odometerValue < 0;
  const sectionStyle = [styles.fields, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  const moveToStep = (value: number) => {
    Keyboard.dismiss();
    setSubmitted(false);
    setError('');
    setStep(value);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const next = async () => {
    setSubmitted(true);
    if (step === 1 && (!brand.trim() || !model.trim())) return;
    if (step === 2 && (!suggestedNickname || invalidYear)) return;
    if (step === 3 && invalidOdometer) return;
    if (step < 4) {
      moveToStep(step + 1);
      return;
    }
    if (odometerValue === undefined || saving) return;
    setSaving(true);
    let savedPhotoUri: string | undefined;
    try {
      savedPhotoUri = photoUri ? persistMotorcyclePhoto(photoUri) : undefined;
      const id = addMotorcycle({
        nickname: suggestedNickname,
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim() || undefined,
        year: year ? Number(year) : undefined,
        type,
        currentOdometer: odometerValue,
        themeColor: color.value,
        colorName: color.name,
        photoUri: savedPhotoUri,
      });
      useAppStore.getState().setActiveMotorcycle(id);
      router.replace('/');
    } catch {
      removeMotorcyclePhoto(savedPhotoUri);
      setError('Motor belum tersimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
          paddingBottom: Math.max(insets.bottom, 24),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }]}>
          <View style={styles.progress}>
            <View style={styles.header}>
              <Button icon="arrow-left" onPress={() => step === 1 ? router.back() : moveToStep(step - 1)} style={styles.back} contentStyle={styles.button}>
                {step === 1 ? 'Batal' : 'Kembali'}
              </Button>
              <Text variant="labelLarge" accessibilityLiveRegion="polite">Langkah {step} dari 4</Text>
            </View>
            <ProgressBar progress={step / 4} accessibilityLabel={`Langkah ${step} dari 4`} />
          </View>
          {step === 1 ? (
            <>
              <View style={styles.heading}>
                <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Motor apa yang Anda kendarai?</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Mulai dari identitas motor Anda.</Text>
              </View>
              <View style={sectionStyle}>
                <View>
                  <TextInput label="Merek" accessibilityLabel="Merek" mode="outlined" value={brand} onChangeText={setBrand} placeholder="Contoh: Yamaha" error={submitted && !brand.trim()} />
                  {submitted && !brand.trim() ? <HelperText type="error">Merek wajib diisi.</HelperText> : null}
                </View>
                <View>
                  <TextInput label="Model" accessibilityLabel="Model" mode="outlined" value={model} onChangeText={setModel} placeholder="Contoh: NMAX" error={submitted && !model.trim()} />
                  {submitted && !model.trim() ? <HelperText type="error">Model wajib diisi.</HelperText> : null}
                </View>
                <TextInput label="Varian (opsional)" accessibilityLabel="Varian (opsional)" mode="outlined" value={variant} onChangeText={setVariant} />
              </View>
            </>
          ) : step === 2 ? (
            <>
              <View style={styles.heading}>
                <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Ceritakan sedikit lagi</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Informasi ini membantu membuat jadwal yang relevan.</Text>
              </View>
              <View style={sectionStyle}>
                <View>
                  <TextInput label="Nama panggilan (opsional)" accessibilityLabel="Nama panggilan (opsional)" mode="outlined" value={nickname} onChangeText={setNickname} placeholder={model || 'Nama motor'} />
                  <HelperText type="info">Jika kosong, nama model digunakan.</HelperText>
                </View>
                <View>
                  <TextInput label="Tahun (opsional)" accessibilityLabel="Tahun (opsional)" mode="outlined" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} error={submitted && invalidYear} />
                  {submitted && invalidYear ? <HelperText type="error">Masukkan tahun dengan 4 digit.</HelperText> : null}
                </View>
              </View>
              <View style={sectionStyle}>
                <Text variant="titleMedium">Jenis motor</Text>
                <RadioButton.Group value={type} onValueChange={(value) => setType(value as MotorcycleType)}>
                  <RadioButton.Item label="Skuter" value="scooter" />
                  <RadioButton.Item label="Bebek" value="cub" />
                  <RadioButton.Item label="Manual" value="manual" />
                </RadioButton.Group>
              </View>
            </>
          ) : step === 3 ? (
            <>
              <View style={styles.heading}>
                <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Berapa kilometer saat ini?</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Lihat angka odometer di panel motor, bukan trip meter. Anda bisa memperbaruinya kapan saja.</Text>
              </View>
              <View style={sectionStyle}>
                <TextInput label="Odometer saat ini" accessibilityLabel="Odometer saat ini" mode="outlined" value={odometer} onChangeText={(value) => setOdometer(formatIntegerInput(value))} keyboardType="number-pad" right={<TextInput.Affix text="km" />} error={submitted && invalidOdometer} />
                {submitted && invalidOdometer ? <HelperText type="error">Masukkan kilometer berupa angka bulat, minimal 0.</HelperText> : null}
              </View>
            </>
          ) : (
            <>
              <View style={styles.heading}>
                <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Pilih warna motor</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Warna ini membantu Anda mengenali motor di garage.</Text>
              </View>
              <MotorcycleColorPicker selected={color} onSelect={setColor} />
              <MotorcyclePhotoPicker value={photoUri} onChange={setPhotoUri} disabled={saving} />
              <View style={sectionStyle}>
                <Text variant="titleMedium">Ringkasan motor</Text>
                <Text variant="headlineSmall" style={styles.title}>{suggestedNickname}</Text>
                <Text variant="bodyLarge">{brand} {model}{variant ? ` ${variant}` : ''}</Text>
                <Text variant="bodyMedium">
                  {type === 'scooter' ? 'Skuter' : type === 'cub' ? 'Bebek' : 'Manual'}{year ? ` / ${year}` : ''} / {color.name}
                </Text>
                <Text variant="bodyLarge">{odometerValue?.toLocaleString('id-ID') ?? '0'} km</Text>
              </View>
            </>
          )}
          {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
          <Button mode="contained" onPress={next} loading={saving} disabled={saving} contentStyle={styles.button}>{step === 4 ? 'Simpan motor' : 'Lanjut'}</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 20, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  progress: { gap: 16 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  back: { marginLeft: -8 },
  heading: { gap: 8 },
  title: { fontWeight: '700' },
  fields: { gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  button: { minHeight: 48 },
});
