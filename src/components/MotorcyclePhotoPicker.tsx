import { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';
import { CARD_SHADOW } from '@/src/theme/theme';

export function MotorcyclePhotoPicker({ value, onChange, disabled = false }: {
  value?: string;
  onChange: (uri: string) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unavailable = Platform.OS === 'web';

  const choosePhoto = async (source: 'camera' | 'library') => {
    if (busy || disabled || unavailable) return;
    setBusy(true);
    setError('');
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError('Izin kamera belum diberikan. Aktifkan izin kamera di pengaturan perangkat.');
          return;
        }
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
    } catch {
      setError('Foto belum dapat dipilih. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Text variant="titleMedium">Foto motor</Text>
      {value ? (
        <Image source={{ uri: value }} resizeMode="cover" accessibilityLabel="Foto profil motor" style={styles.photo} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="motorbike" size={40} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Belum ada foto</Text>
        </View>
      )}
      <View style={styles.actions}>
        <Button mode="outlined" icon="image-outline" disabled={disabled || busy || unavailable} loading={busy} style={styles.action} contentStyle={styles.button} onPress={() => choosePhoto('library')}>Galeri</Button>
        <Button mode="outlined" icon="camera-outline" disabled={disabled || busy || unavailable} style={styles.action} contentStyle={styles.button} onPress={() => choosePhoto('camera')}>Kamera</Button>
        {value ? <Button mode="text" icon="close" disabled={disabled || busy || unavailable} contentStyle={styles.button} onPress={() => { setError(''); onChange(''); }}>Hapus foto</Button> : null}
      </View>
      <HelperText type="info">{unavailable ? 'Foto dapat dikelola di aplikasi Android atau iOS.' : 'Foto tersimpan di perangkat ini.'}</HelperText>
      {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 20, borderRadius: 20, borderWidth: 1 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16 },
  placeholder: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  action: { flexGrow: 1, flexBasis: 120 },
  button: { minHeight: 48 },
});
