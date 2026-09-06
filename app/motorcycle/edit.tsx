import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function EditMotorcycleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === id));
  const update = useAppStore((state) => state.updateMotorcycle);
  const [nickname, setNickname] = useState(motorcycle?.nickname ?? '');
  const [brand, setBrand] = useState(motorcycle?.brand ?? '');
  const [model, setModel] = useState(motorcycle?.model ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const save = () => {
    setSubmitted(true);
    if (!motorcycle || !nickname.trim() || !brand.trim() || !model.trim()) return;
    try {
      update(motorcycle.id, { nickname: nickname.trim(), brand: brand.trim(), model: model.trim() });
      router.back();
    } catch {
      setError('Perubahan belum tersimpan. Coba lagi.');
    }
  };

  if (!motorcycle) return (
    <Screen>
      <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Motor tidak ditemukan.</Text>
      <Button onPress={() => router.back()} contentStyle={styles.button}>Kembali</Button>
    </Screen>
  );

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
          paddingBottom: Math.max(insets.bottom, 24),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }]}>
          <Button icon="arrow-left" onPress={() => router.back()} style={styles.back} contentStyle={styles.button}>Detail motor</Button>
          <View style={styles.heading}>
            <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>Edit motor</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Perbarui identitas motor. Riwayat perawatan Anda tetap tersimpan.</Text>
          </View>
          <View style={[styles.fields, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
            <Text variant="titleMedium">Identitas motor</Text>
            <View>
              <TextInput label="Nama panggilan" accessibilityLabel="Nama panggilan" mode="outlined" value={nickname} onChangeText={setNickname} error={submitted && !nickname.trim()} />
              {submitted && !nickname.trim() ? <HelperText type="error">Nama panggilan wajib diisi.</HelperText> : null}
            </View>
            <View>
              <TextInput label="Merek" accessibilityLabel="Merek" mode="outlined" value={brand} onChangeText={setBrand} error={submitted && !brand.trim()} />
              {submitted && !brand.trim() ? <HelperText type="error">Merek wajib diisi.</HelperText> : null}
            </View>
            <View>
              <TextInput label="Model" accessibilityLabel="Model" mode="outlined" value={model} onChangeText={setModel} error={submitted && !model.trim()} />
              {submitted && !model.trim() ? <HelperText type="error">Model wajib diisi.</HelperText> : null}
            </View>
          </View>
          {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
          <Button mode="contained" onPress={save} contentStyle={styles.button}>Simpan perubahan</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 20, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  back: { alignSelf: 'flex-start', marginLeft: -8 },
  heading: { gap: 8 },
  title: { fontWeight: '700' },
  fields: { gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  button: { minHeight: 48 },
});
