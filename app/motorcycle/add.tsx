import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import type { MotorcycleType } from '@/src/domain/types';

const colors = [{ name: 'Biru', value: '#2563EB' }, { name: 'Merah', value: '#DC2626' }, { name: 'Hitam', value: '#334155' }, { name: 'Putih', value: '#CBD5E1' }, { name: 'Hijau', value: '#16A34A' }, { name: 'Kuning', value: '#CA8A04' }];

export default function AddMotorcycleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const addMotorcycle = useAppStore((state) => state.addMotorcycle);
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<MotorcycleType>('scooter');
  const [odometer, setOdometer] = useState('0');
  const [color, setColor] = useState(colors[0]);
  const suggestedNickname = nickname || model;
  const next = () => {
    if (step === 1 && (!brand.trim() || !model.trim())) return;
    if (step === 2 && !suggestedNickname.trim()) return;
    if (step < 4) setStep(step + 1);
    else {
      const id = addMotorcycle({ nickname: suggestedNickname.trim(), brand: brand.trim(), model: model.trim(), variant: variant.trim() || undefined, year: year ? Number(year) : undefined, type, currentOdometer: Math.max(0, Number(odometer) || 0), themeColor: color.value, colorName: color.name });
      useAppStore.getState().setActiveMotorcycle(id);
      router.replace('/');
    }
  };
  return <Screen><View style={styles.header}><Button icon="arrow-left" onPress={() => step === 1 ? router.back() : setStep(step - 1)} accessibilityLabel="Kembali">{step === 1 ? 'Batal' : 'Kembali'}</Button><Text variant="labelLarge">{step} dari 4</Text></View>{step === 1 ? <><Text variant="headlineMedium" style={styles.title}>Motor apa yang Anda kendarai?</Text><Text variant="bodyMedium" style={styles.copy}>Mulai dari identitas motor Anda.</Text><TextInput label="Merek" mode="outlined" value={brand} onChangeText={setBrand} placeholder="Contoh: Yamaha" style={styles.input} /><TextInput label="Model" mode="outlined" value={model} onChangeText={setModel} placeholder="Contoh: NMAX" style={styles.input} /><TextInput label="Varian (opsional)" mode="outlined" value={variant} onChangeText={setVariant} style={styles.input} /></> : step === 2 ? <><Text variant="headlineMedium" style={styles.title}>Ceritakan sedikit lagi</Text><Text variant="bodyMedium" style={styles.copy}>Informasi ini membantu membuat jadwal yang relevan.</Text><TextInput label="Nama panggilan" mode="outlined" value={nickname} onChangeText={setNickname} placeholder={model || 'Nama motor'} style={styles.input} /><TextInput label="Tahun (opsional)" mode="outlined" value={year} onChangeText={setYear} keyboardType="number-pad" style={styles.input} /><Text variant="labelLarge" style={styles.label}>Jenis motor</Text><SegmentedButtons value={type} onValueChange={(value) => setType(value as MotorcycleType)} buttons={[{ value: 'scooter', label: 'Skuter' }, { value: 'cub', label: 'Bebek' }, { value: 'manual', label: 'Manual' }]} /></> : step === 3 ? <><Text variant="headlineMedium" style={styles.title}>Berapa kilometer saat ini?</Text><Text variant="bodyMedium" style={styles.copy}>Anda bisa memperbaruinya kapan saja.</Text><TextInput label="Odometer saat ini" mode="outlined" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" right={<TextInput.Affix text="km" />} style={styles.odometerInput} /></> : <><Text variant="headlineMedium" style={styles.title}>Pilih warna motor</Text><Text variant="bodyMedium" style={styles.copy}>Warna ini menjadi aksen tampilan aplikasi.</Text><View style={styles.swatches}>{colors.map((item) => <Button key={item.value} mode={color.value === item.value ? 'contained' : 'outlined'} onPress={() => setColor(item)} style={styles.swatch} buttonColor={color.value === item.value ? item.value : undefined} textColor={color.value === item.value ? '#FFF' : theme.colors.onSurface}>{item.name}</Button>)}</View><View style={[styles.preview, { backgroundColor: theme.colors.primaryContainer }]}><View style={[styles.previewIcon, { backgroundColor: color.value }]}><Text style={styles.previewText}>{(model || 'MO').slice(0, 2).toUpperCase()}</Text></View><View><Text variant="titleMedium">{suggestedNickname || 'Motor Anda'}</Text><Text variant="bodySmall">{brand || 'Merek'} {model || 'Model'}</Text></View></View></>}<Button mode="contained" onPress={next} style={styles.next}>{step === 4 ? 'Simpan motor' : 'Lanjut'}</Button></Screen>;
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { marginTop: 28, fontWeight: '700' }, copy: { marginTop: 10, opacity: 0.7, lineHeight: 22 }, input: { marginTop: 18 }, label: { marginTop: 24, marginBottom: 10 }, odometerInput: { marginTop: 28, height: 68 }, swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }, swatch: { minWidth: 92 }, preview: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, marginTop: 28 }, previewIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 }, previewText: { color: '#FFF', fontWeight: '700' }, next: { marginTop: 32 } });
