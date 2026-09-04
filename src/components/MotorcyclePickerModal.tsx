import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import type { Motorcycle } from '@/src/domain/types';

export function MotorcyclePickerModal({ visible, motorcycles, activeId, onSelect, onAdd, onDismiss }: { visible: boolean; motorcycles: Motorcycle[]; activeId?: string; onSelect: (id: string) => void; onAdd: () => void; onDismiss: () => void }) {
  const theme = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}><Text variant="headlineSmall">Motor saya</Text>{motorcycles.map((motorcycle) => <Pressable key={motorcycle.id} onPress={() => { onSelect(motorcycle.id); onDismiss(); }} style={styles.item}><View style={[styles.radio, { borderColor: theme.colors.primary }]}>{activeId === motorcycle.id ? <View style={[styles.selected, { backgroundColor: theme.colors.primary }]} /> : null}</View><View><Text variant="titleMedium">{motorcycle.nickname}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text></View></Pressable>)}<Button icon="plus" mode="outlined" onPress={() => { onDismiss(); onAdd(); }} style={styles.add}>Tambah motor</Button></View></View></Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' }, sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 }, item: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, selected: { width: 10, height: 10, borderRadius: 5 }, add: { marginTop: 16 } });
