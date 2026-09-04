import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Button, Divider, List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';

export default function SettingsScreen() {
  const preferences = useAppStore((state) => state.preferences);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccent = useAppStore((state) => state.setUseMotorcycleAccent);
  const resetData = useAppStore((state) => state.resetData);
  return <Screen><Text variant="headlineMedium" style={styles.title}>Pengaturan</Text><Text variant="bodyMedium" style={styles.subtitle}>Atur tampilan dan data lokal Anda.</Text><List.Subheader>Tampilan</List.Subheader><SegmentedButtons value={preferences.themeMode} onValueChange={(value) => setThemeMode(value as 'system' | 'light' | 'dark')} buttons={[{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }]} /><View style={styles.row}><View style={styles.flex}><Text variant="titleMedium">Gunakan warna motor</Text><Text variant="bodySmall" style={styles.muted}>Warna aksen mengikuti motor aktif.</Text></View><Switch value={preferences.useMotorcycleAccent} onValueChange={setAccent} /></View><Divider /><List.Subheader>Data</List.Subheader><Button mode="outlined" textColor="#B91C1C" onPress={() => Alert.alert('Reset semua data?', 'Semua motor, riwayat, dan pengingat akan dihapus dari perangkat ini.', [{ text: 'Batal', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: resetData }])}>Reset data aplikasi</Button><List.Subheader>Tentang</List.Subheader><Text variant="bodyMedium" style={styles.about}>Data Anda disimpan di perangkat ini. Menghapus aplikasi dapat menghapus data tersebut.</Text><Button mode="text" onPress={() => Linking.openSettings()}>Buka pengaturan Android</Button></Screen>;
}

const styles = StyleSheet.create({ title: { fontWeight: '700', marginTop: 8 }, subtitle: { opacity: 0.7, marginTop: 6, marginBottom: 20 }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', marginVertical: 12 }, flex: { flex: 1 }, muted: { opacity: 0.65, marginTop: 4 }, about: { opacity: 0.7, lineHeight: 22 } });
