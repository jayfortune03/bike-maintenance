import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, FAB, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { SectionTitle } from '@/src/components/SectionTitle';
import { MotorcycleSelector } from '@/src/components/MotorcycleSelector';
import { MotorcyclePickerModal } from '@/src/components/MotorcyclePickerModal';
import { OdometerDialog } from '@/src/components/OdometerDialog';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { selectActiveMotorcycle, useAppStore } from '@/src/store/app.store';
import { calculateMaintenanceStatus } from '@/src/domain/maintenance-calculator';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const motorcycles = useAppStore((state) => state.motorcycles);
  const activeId = useAppStore((state) => state.activeMotorcycleId);
  const motorcycle = useAppStore(selectActiveMotorcycle);
  const rules = useAppStore((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === state.activeMotorcycleId && rule.enabled));
  const logs = useAppStore((state) => state.maintenanceLogs.filter((log) => log.motorcycleId === state.activeMotorcycleId).slice(-3).reverse());
  const setActive = useAppStore((state) => state.setActiveMotorcycle);
  const updateOdometer = useAppStore((state) => state.updateOdometer);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [odometerVisible, setOdometerVisible] = useState(false);
  const attention = rules.filter((rule) => ['overdue', 'due', 'soon'].includes(calculateMaintenanceStatus({ currentOdometer: motorcycle?.currentOdometer ?? 0, currentDate: new Date().toISOString(), intervalKm: rule.intervalKm, intervalDays: rule.intervalDays, lastCompletedKm: rule.lastCompletedKm, lastCompletedAt: rule.lastCompletedAt }).status)).slice(0, 3);

  if (!motorcycle) return <Screen><View style={styles.welcome}><Text variant="headlineMedium" style={styles.welcomeTitle}>Rawat motor lebih mudah</Text><Text variant="bodyLarge" style={styles.welcomeCopy}>Catat perawatan, kilometer, dan pengingat dalam satu tempat.</Text><Button mode="contained" onPress={() => router.push('/motorcycle/add')} style={styles.welcomeButton}>Tambah motor</Button></View><EmptyState title="Garage masih kosong" description="Tambahkan motor untuk mulai memantau perawatan." action="Tambah motor" onPress={() => router.push('/motorcycle/add')} /></Screen>;

  return <Screen><MotorcycleSelector motorcycle={motorcycle} onPress={() => setPickerVisible(true)} /><View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}><View style={styles.heroTop}><View><Text variant="headlineSmall">{motorcycle.nickname}</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.brand} {motorcycle.model}</Text></View><View style={[styles.modelBadge, { backgroundColor: motorcycle.themeColor }]}><Text style={styles.badgeText}>{motorcycle.model.slice(0, 2).toUpperCase()}</Text></View></View><Text variant="displaySmall" style={styles.odometer}>{motorcycle.currentOdometer.toLocaleString('id-ID')}<Text variant="titleMedium"> km</Text></Text><Button mode="contained" compact onPress={() => setOdometerVisible(true)} style={styles.heroButton}>Update odometer</Button></View>{attention.length ? <><SectionTitle>Perlu perhatian</SectionTitle>{attention.map((rule) => <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />)}</> : <Card mode="contained" style={styles.goodCard}><Card.Content><Text variant="titleMedium">Semua terlihat baik</Text><Text variant="bodyMedium" style={styles.muted}>Belum ada perawatan yang perlu dilakukan sekarang.</Text></Card.Content></Card>}<SectionTitle>Aksi cepat</SectionTitle><View style={styles.actions}><Button icon="gauge" mode="outlined" onPress={() => setOdometerVisible(true)} style={styles.action}>Odometer</Button><Button icon="bell-outline" mode="outlined" onPress={() => router.push('/reminder/create')} style={styles.action}>Pengingat</Button><Button icon="wrench-outline" mode="outlined" onPress={() => router.push('/(tabs)/maintenance')} style={styles.action}>Perawatan</Button></View>{logs.length ? <><SectionTitle>Aktivitas terakhir</SectionTitle>{logs.map((log) => <View key={log.id} style={styles.log}><View style={[styles.logDot, { backgroundColor: theme.colors.primary }]} /><View><Text variant="bodyLarge">{log.title}</Text><Text variant="bodySmall" style={styles.muted}>{log.odometer ? `${log.odometer.toLocaleString('id-ID')} km` : 'Tanpa odometer'} · {new Date(log.completedAt).toLocaleDateString('id-ID')}</Text></View></View>)}</> : null}<MotorcyclePickerModal visible={pickerVisible} motorcycles={motorcycles} activeId={activeId} onSelect={setActive} onAdd={() => router.push('/motorcycle/add')} onDismiss={() => setPickerVisible(false)} /><OdometerDialog motorcycle={motorcycle} visible={odometerVisible} onDismiss={() => setOdometerVisible(false)} onSave={(value) => updateOdometer(motorcycle.id, value)} /><FAB icon="plus" label="Pengingat" onPress={() => router.push('/reminder/create')} style={styles.fab} /> </Screen>;
}

const styles = StyleSheet.create({ welcome: { paddingTop: 28 }, welcomeTitle: { fontWeight: '700' }, welcomeCopy: { marginTop: 10, lineHeight: 24, opacity: 0.7 }, welcomeButton: { alignSelf: 'flex-start', marginTop: 24 }, hero: { borderRadius: 22, padding: 20, marginVertical: 24 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modelBadge: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#FFF', fontWeight: '800', fontSize: 18 }, odometer: { marginTop: 24, fontWeight: '700' }, heroButton: { alignSelf: 'flex-start', marginTop: 16 }, goodCard: { marginBottom: 22 }, muted: { opacity: 0.65, marginTop: 4 }, actions: { flexDirection: 'row', gap: 8, marginBottom: 24 }, action: { flex: 1 }, log: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, logDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 }, fab: { position: 'absolute', right: 20, bottom: 16 } });
