import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Motorcycle } from '@/src/domain/types';
import { Sheet } from '@/src/components/Sheet';

export function MotorcyclePickerModal({ visible, motorcycles, activeId, onSelect, onAdd, onDismiss }: {
  visible: boolean;
  motorcycles: Motorcycle[];
  activeId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Sheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text variant="headlineSmall" style={styles.title}>Motor saya</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Pilih motor yang ingin Anda pantau.</Text>
        </View>
        <IconButton icon="close" accessibilityLabel="Tutup pilihan motor" onPress={onDismiss} />
      </View>
      <FlatList
        data={motorcycles}
        extraData={activeId}
        keyExtractor={(motorcycle) => motorcycle.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: motorcycle }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: activeId === motorcycle.id }}
            onPress={() => { onSelect(motorcycle.id); onDismiss(); }}
            style={({ pressed }) => [styles.item, {
              backgroundColor: activeId === motorcycle.id ? theme.colors.secondaryContainer : theme.colors.surfaceVariant,
              opacity: pressed ? 0.7 : 1,
            }]}
          >
            <View style={[styles.avatar, { backgroundColor: motorcycle.themeColor }]}>
              <MaterialCommunityIcons name="motorbike" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.copy}>
              <Text variant="titleMedium" style={styles.title}>{motorcycle.nickname}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {motorcycle.brand} {motorcycle.model}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {motorcycle.currentOdometer.toLocaleString('id-ID')} km
              </Text>
            </View>
            {activeId === motorcycle.id ? <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} /> : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text variant="bodyMedium">Belum ada motor. Tambahkan motor pertama Anda.</Text>}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button icon="plus" mode="outlined" contentStyle={styles.button} onPress={() => { onDismiss(); onAdd(); }}>
          Tambah motor
        </Button>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', paddingLeft: 24, paddingRight: 8, paddingVertical: 16, gap: 16 },
  title: { fontWeight: '700' },
  list: { paddingHorizontal: 24, gap: 16 },
  item: { minHeight: 80, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  footer: { padding: 24 },
  button: { minHeight: 48 },
});
