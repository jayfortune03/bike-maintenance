import { useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
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
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}><Text variant="headlineSmall">Update odometer</Text><Text variant="bodyMedium" style={styles.copy}>Catat kilometer terbaru untuk {motorcycle.nickname}.</Text><TextInput mode="outlined" label="Kilometer saat ini" value={value} onChangeText={setValue} keyboardType="number-pad" right={<TextInput.Affix text="km" />} /><View style={styles.actions}><Button onPress={onDismiss}>Batal</Button><Button mode="contained" onPress={save}>Simpan</Button></View></View></View></Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' }, sheet: { padding: 24, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, copy: { marginTop: 8, marginBottom: 20, opacity: 0.7 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 } });
