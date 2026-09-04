import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';

export default function EditMotorcycleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === id));
  const update = useAppStore((state) => state.updateMotorcycle);
  const [nickname, setNickname] = useState(motorcycle?.nickname ?? '');
  const [brand, setBrand] = useState(motorcycle?.brand ?? '');
  const [model, setModel] = useState(motorcycle?.model ?? '');
  if (!motorcycle) return <Screen><Text>Motor tidak ditemukan.</Text></Screen>;
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Edit motor</Button><Text variant="headlineMedium" style={styles.title}>Edit motor</Text><TextInput label="Nama panggilan" mode="outlined" value={nickname} onChangeText={setNickname} style={styles.input} /><TextInput label="Merek" mode="outlined" value={brand} onChangeText={setBrand} style={styles.input} /><TextInput label="Model" mode="outlined" value={model} onChangeText={setModel} style={styles.input} /><Button mode="contained" onPress={() => { if (!nickname.trim() || !brand.trim() || !model.trim()) return; update(motorcycle.id, { nickname: nickname.trim(), brand: brand.trim(), model: model.trim() }); router.back(); }} style={styles.save}>Simpan perubahan</Button></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 24 }, input: { marginTop: 18 }, save: { marginTop: 28 } });
