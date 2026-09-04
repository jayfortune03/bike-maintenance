import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { useAppStore } from '@/src/store/app.store';

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === id));
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === rule?.motorcycleId));
  const complete = useAppStore((state) => state.completeMaintenance);
  const [visible, setVisible] = useState(false);
  const [odometer, setOdometer] = useState(motorcycle ? String(motorcycle.currentOdometer) : '');
  if (!rule || !motorcycle) return <Screen><Text>Jadwal tidak ditemukan.</Text></Screen>;
  return <Screen><Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Perawatan</Button><Text variant="headlineMedium" style={styles.title}>{rule.title}</Text><Text variant="bodyMedium" style={styles.subtitle}>{motorcycle.nickname}</Text><MaintenanceCard rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => undefined} /><Card mode="contained" style={styles.info}><Card.Content><Text variant="titleMedium">Tentang jadwal ini</Text><Text variant="bodyMedium" style={styles.infoText}>{rule.description ?? 'Jadwal ini adalah saran umum. Periksa buku manual motor Anda untuk interval yang tepat.'}</Text><Text variant="labelLarge" style={{ color: theme.colors.primary }}>{rule.sourceLabel}</Text>{rule.intervalKm ? <Text variant="bodyMedium" style={styles.infoText}>Setiap {rule.intervalKm.toLocaleString('id-ID')} km</Text> : null}{rule.intervalDays ? <Text variant="bodyMedium" style={styles.infoText}>atau setiap {rule.intervalDays} hari</Text> : null}</Card.Content></Card><View style={styles.buttons}><Button mode="contained" onPress={() => setVisible(true)}>Tandai selesai</Button><Button mode="outlined" onPress={() => router.push(`/reminder/create?ruleId=${rule.id}`)}>Buat pengingat</Button><Button mode="text" onPress={() => router.push(`/maintenance/edit?id=${rule.id}`)}>Edit jadwal</Button></View><Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}><Text variant="headlineSmall">Catat perawatan</Text><Text variant="bodyMedium" style={styles.subtitle}>Simpan riwayat untuk {rule.title}.</Text><TextInput label="Odometer" mode="outlined" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" right={<TextInput.Affix text="km" />} /><View style={styles.modalButtons}><Button onPress={() => setVisible(false)}>Batal</Button><Button mode="contained" onPress={() => { complete(rule.id, { completedAt: new Date().toISOString(), odometer: Number(odometer) || undefined }); setVisible(false); }}>Simpan</Button></View></View></View></Modal></Screen>;
}

const styles = StyleSheet.create({ back: { alignSelf: 'flex-start', marginLeft: -8 }, title: { fontWeight: '700', marginTop: 22 }, subtitle: { opacity: 0.7, marginTop: 5, marginBottom: 18 }, info: { marginTop: 4 }, infoText: { lineHeight: 22, marginTop: 10, opacity: 0.75 }, buttons: { gap: 10, marginTop: 22 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' }, sheet: { padding: 24, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 } });
