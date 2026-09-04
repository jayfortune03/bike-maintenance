import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';

export default function CustomMaintenanceScreen() {
  const router = useRouter();
  const motorcycleId = useAppStore((state) => state.activeMotorcycleId);
  const addCustomRule = useAppStore((state) => state.addCustomRule);
  const [title, setTitle] = useState('');
  const [km, setKm] = useState('');
  const [days, setDays] = useState('');
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Perawatan</Button><Text variant="headlineMedium" style={styles.title}>Tambah jadwal custom</Text><Text variant="bodyMedium" style={styles.copy}>Buat pengingat sesuai kebutuhan motor Anda.</Text><TextInput label="Nama perawatan" mode="outlined" value={title} onChangeText={setTitle} placeholder="Contoh: Lumasi rantai" style={styles.input} /><TextInput label="Interval jarak (opsional)" mode="outlined" value={km} onChangeText={setKm} keyboardType="number-pad" right={<TextInput.Affix text="km" />} style={styles.input} /><TextInput label="Interval waktu (opsional)" mode="outlined" value={days} onChangeText={setDays} keyboardType="number-pad" right={<TextInput.Affix text="hari" />} style={styles.input} /><Button mode="contained" onPress={() => { if (!motorcycleId || !title.trim() || (!km && !days)) return; addCustomRule({ motorcycleId, title: title.trim(), intervalKm: km ? Number(km) : undefined, intervalDays: days ? Number(days) : undefined }); router.back(); }} style={styles.save}>Simpan jadwal</Button></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 24 }, copy: { marginTop: 8, opacity: 0.7 }, input: { marginTop: 18 }, save: { marginTop: 28 } });
