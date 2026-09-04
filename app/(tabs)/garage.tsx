import { Alert, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { MotorcycleCard } from '@/src/components/MotorcycleCard';
import { useAppStore } from '@/src/store/app.store';

export default function GarageScreen() {
  const router = useRouter();
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  return <Screen><Text variant="headlineMedium" style={styles.title}>Garage saya</Text><Text variant="bodyMedium" style={styles.subtitle}>Simpan semua motor dan jadwal perawatannya.</Text>{motorcycles.length ? motorcycles.map((motorcycle) => <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} active={activeId === motorcycle.id} onPress={() => { setActive(motorcycle.id); router.push(`/motorcycle/${motorcycle.id}`); }} />) : <EmptyState title="Garage masih kosong" description="Tambahkan motor untuk mulai mencatat perawatan." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} />}<Button icon="plus" mode="contained" onPress={() => router.push('/motorcycle/add')} style={styles.add}>Tambah motor</Button></Screen>;
}

const styles = StyleSheet.create({ title: { fontWeight: '700', marginTop: 8 }, subtitle: { opacity: 0.7, marginTop: 6, marginBottom: 24 }, add: { marginTop: 8 } });
