import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Motorcycle } from '@/src/domain/types';
import { formatIntegerInput, parseIntegerInput } from '@/src/domain/integer-input';
import { Sheet } from '@/src/components/Sheet';

export function OdometerDialog({ motorcycle, visible, onDismiss, onSave }: {
  motorcycle: Motorcycle;
  visible: boolean;
  onDismiss: () => void;
  onSave: (value: number) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(formatIntegerInput(String(motorcycle.currentOdometer)));
  const [error, setError] = useState('');
  const [confirmCorrection, setConfirmCorrection] = useState(false);
  useEffect(() => {
    if (visible) {
      setValue(formatIntegerInput(String(motorcycle.currentOdometer)));
      setError('');
      setConfirmCorrection(false);
    }
  }, [visible, motorcycle.id, motorcycle.currentOdometer]);

  const save = () => {
    const parsed = parseIntegerInput(value);
    if (parsed === undefined || !Number.isSafeInteger(parsed) || parsed < 0) {
      setError('Masukkan kilometer berupa angka bulat, minimal 0.');
      return;
    }
    if (parsed < motorcycle.currentOdometer && !confirmCorrection) {
      setConfirmCorrection(true);
      return;
    }
    try {
      onSave(parsed);
      onDismiss();
    } catch {
      setError('Odometer belum tersimpan. Coba lagi.');
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.heading}>
        <MaterialCommunityIcons name="speedometer" size={24} color={theme.colors.primary} />
        <View style={styles.headingCopy}>
          <Text variant="titleLarge" accessibilityRole="header" style={styles.title}>Update odometer</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.nickname}</Text>
        </View>
        <IconButton icon="close" accessibilityLabel="Tutup update odometer" onPress={onDismiss} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Catat kilometer terbaru agar jadwal servis tetap akurat. Terakhir {motorcycle.currentOdometer.toLocaleString('id-ID')} km.
        </Text>
        <View>
          <TextInput
            mode="outlined"
            label="Kilometer saat ini"
            accessibilityLabel="Kilometer saat ini"
            value={value}
            onChangeText={(text) => { setValue(formatIntegerInput(text)); setError(''); setConfirmCorrection(false); }}
            keyboardType="number-pad"
            error={!!error}
            right={<TextInput.Affix text="km" />}
          />
          {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
        </View>
        {confirmCorrection ? (
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>
            Angka ini lebih kecil dari odometer terakhir. Simpan hanya jika Anda ingin mengoreksi catatan sebelumnya.
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button mode="contained" onPress={save} contentStyle={styles.button}>
            {confirmCorrection ? 'Simpan koreksi' : 'Simpan odometer'}
          </Button>
          <Button onPress={onDismiss} contentStyle={styles.button}>Batal</Button>
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 24, paddingRight: 8, paddingVertical: 16 },
  headingCopy: { flex: 1, gap: 4 },
  title: { fontWeight: '700' },
  content: { paddingHorizontal: 24, gap: 24 },
  actions: { gap: 16 },
  button: { minHeight: 48 },
});
