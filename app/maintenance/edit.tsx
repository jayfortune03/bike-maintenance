import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';

export default function EditMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === id));
  const update = useAppStore((state) => state.updateMaintenanceRule);
  const [title, setTitle] = useState(rule?.title ?? '');
  const [km, setKm] = useState(rule?.intervalKm?.toString() ?? '');
  const [days, setDays] = useState(rule?.intervalDays?.toString() ?? '');
  if (!rule) return <Screen><Text>Jadwal tidak ditemukan.</Text></Screen>;
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Perawatan</Button><Text variant="headlineMedium" style={styles.title}>Edit jadwal</Text><TextInput label="Nama perawatan" mode="outlined" value={title} onChangeText={setTitle} style={styles.input} /><TextInput label="Interval jarak" mode="outlined" value={km} onChangeText={setKm} keyboardType="number-pad" right={<TextInput.Affix text="km" />} style={styles.input} /><TextInput label="Interval waktu" mode="outlined" value={days} onChangeText={setDays} keyboardType="number-pad" right={<TextInput.Affix text="hari" />} style={styles.input} /><Button mode="contained" onPress={() => { update(rule.id, { title: title.trim(), intervalKm: km ? Number(km) : undefined, intervalDays: days ? Number(days) : undefined }); router.back(); }} style={styles.save}>Simpan jadwal</Button></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 24 }, input: { marginTop: 18 }, save: { marginTop: 28 } });
