import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { MotorcycleCard } from '@/src/components/MotorcycleCard';
import { useAppStore } from '@/src/store/app.store';

export default function GarageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const setActive = useAppStore((state) => state.setActiveMotorcycle);

  return <Screen><View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="garage-variant" size={25} color={theme.colors.primary} /></View><Text variant="headlineMedium" style={styles.title}>Garage saya</Text><Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Semua motor, satu tempat untuk dirawat.</Text></View>{motorcycles.length ? <><Card mode="contained" style={[styles.countCard, { backgroundColor: theme.colors.primary }]}><Card.Content style={styles.countContent}><View><Text variant="labelMedium" style={styles.countLabel}>KOLEKSI MOTOR</Text><Text variant="headlineSmall" style={styles.countTitle}>{motorcycles.length} motor tersimpan</Text></View><MaterialCommunityIcons name="motorbike" size={34} color="#FFFFFFB8" /></Card.Content></Card><Text variant="titleMedium" style={styles.sectionTitle}>Daftar motor</Text>{motorcycles.map((motorcycle) => <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} active={activeId === motorcycle.id} onPress={() => { setActive(motorcycle.id); router.push(`/motorcycle/${motorcycle.id}`); }} />)}</> : <Card mode="outlined" style={styles.emptyCard}><Card.Content><EmptyState title="Garage masih kosong" description="Tambahkan motor untuk mulai mencatat perawatan." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} /></Card.Content></Card>}<Button icon="plus" mode="contained" onPress={() => router.push('/motorcycle/add')} style={styles.add}>Tambah motor</Button></Screen>;
}

const styles = StyleSheet.create({ header: { paddingTop: 10 }, headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { fontWeight: '800', letterSpacing: -0.4 }, subtitle: { marginTop: 6, lineHeight: 21 }, countCard: { borderRadius: 22, marginTop: 22 }, countContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, countLabel: { color: '#FFFFFFB8', fontWeight: '700', letterSpacing: 1 }, countTitle: { color: '#FFFFFF', fontWeight: '800', marginTop: 4 }, sectionTitle: { fontWeight: '700', marginTop: 28, marginBottom: 12 }, emptyCard: { borderRadius: 22, marginTop: 24 }, add: { marginTop: 8, marginBottom: 10 } });
