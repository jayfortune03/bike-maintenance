import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/Screen';
import { OdometerDialog } from '@/src/components/OdometerDialog';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { useAppStore } from '@/src/store/app.store';

export default function MotorcycleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === id));
  const rules = useAppStore(useShallow((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === id && rule.enabled)));
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  const updateOdometer = useAppStore((state) => state.updateOdometer);
  const deleteMotorcycle = useAppStore((state) => state.deleteMotorcycle);
  const [odometerVisible, setOdometerVisible] = useState(false);
  if (!motorcycle) return <Screen><Text>Motor tidak ditemukan.</Text></Screen>;
  const remove = () => Alert.alert(`Hapus ${motorcycle.nickname}?`, 'Riwayat perawatan dan pengingat motor ini juga akan dihapus dari perangkat.', [{ text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: () => { deleteMotorcycle(motorcycle.id); router.replace('/(tabs)/garage'); } }]);
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Garage</Button><View style={styles.titleRow}><View style={[styles.badge, { backgroundColor: motorcycle.themeColor }]}><Text style={styles.badgeText}>{motorcycle.model.slice(0, 2).toUpperCase()}</Text></View><View><Text variant="headlineMedium" style={styles.title}>{motorcycle.nickname}</Text><Text variant="bodyMedium">{motorcycle.brand} {motorcycle.model}</Text></View></View><Card mode="contained" style={styles.odometer}><Card.Content><Text variant="labelMedium">ODOMETER SAAT INI</Text><Text variant="displaySmall" style={styles.km}>{motorcycle.currentOdometer.toLocaleString('id-ID')} <Text variant="titleMedium">km</Text></Text><Button mode="outlined" onPress={() => setOdometerVisible(true)}>Update odometer</Button></Card.Content></Card><View style={styles.actions}><Button mode="outlined" onPress={() => router.push(`/motorcycle/edit?id=${motorcycle.id}`)}>Edit</Button><Button mode="text" textColor="#B91C1C" onPress={remove}>Hapus</Button></View><Text variant="titleMedium" style={styles.section}>Jadwal perawatan</Text>{rules.slice(0, 4).map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />)}<OdometerDialog motorcycle={motorcycle} visible={odometerVisible} onDismiss={() => setOdometerVisible(false)} onSave={(value) => updateOdometer(motorcycle.id, value)} /></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 }, badge: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 }, badgeText: { color: '#FFF', fontSize: 20, fontWeight: '800' }, title: { fontWeight: '700' }, odometer: { marginTop: 28 }, km: { fontWeight: '700', marginVertical: 8 }, actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginVertical: 16 }, section: { marginBottom: 14 } });
