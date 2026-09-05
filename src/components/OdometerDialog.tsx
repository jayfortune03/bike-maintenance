import { useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import type { Motorcycle } from '@/src/domain/types';

export function OdometerDialog({ motorcycle, visible, onDismiss, onSave }: { motorcycle: Motorcycle; visible: boolean; onDismiss: () => void; onSave: (value: number) => void }) {
  const theme = useTheme();
  const [value, setValue] = useState(String(motorcycle.currentOdometer));
  const save = () => {
    const parsed = Number(value.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(parsed)) return;
    if (parsed < motorcycle.currentOdometer) {
      Alert.alert('Angka kilometer lebih kecil', `Sebelumnya ${motorcycle.currentOdometer.toLocaleString('id-ID')} km, sekarang ${parsed.toLocaleString('id-ID')} km. Simpan koreksi ini?`, [{ text: 'Batal', style: 'cancel' }, { text: 'Simpan', onPress: () => { onSave(parsed); onDismiss(); } }]);
      return;
    }
    onSave(parsed);
    onDismiss();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}><View style={styles.handle} /><View style={styles.heading}><View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="speedometer" size={22} color={theme.colors.primary} /></View><View><Text variant="headlineSmall" style={styles.title}>Update odometer</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.nickname}</Text></View></View><Text variant="bodyMedium" style={[styles.copy, { color: theme.colors.onSurfaceVariant }]}>Catat kilometer terbaru agar jadwal servis tetap akurat.</Text><TextInput mode="outlined" label="Kilometer saat ini" value={value} onChangeText={setValue} keyboardType="number-pad" right={<TextInput.Affix text="km" />} /><View style={styles.actions}><Button onPress={onDismiss}>Batal</Button><Button mode="contained" onPress={save}>Simpan</Button></View></View></View></Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#02061788' }, sheet: { padding: 24, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 20 }, heading: { flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, title: { fontWeight: '800' }, copy: { marginTop: 16, marginBottom: 20, lineHeight: 21 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 } });
