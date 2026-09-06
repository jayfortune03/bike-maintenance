import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/Screen';
import { OdometerDialog } from '@/src/components/OdometerDialog';
import { MaintenanceCard } from '@/src/components/MaintenanceCard';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export default function MotorcycleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const motorcycle = useAppStore((state) => state.motorcycles.find((item) => item.id === id));
  const rules = useAppStore(useShallow((state) => state.maintenanceRules.filter((rule) => rule.motorcycleId === id && rule.enabled)));
  const updateOdometer = useAppStore((state) => state.updateOdometer);
  const deleteMotorcycle = useAppStore((state) => state.deleteMotorcycle);
  const [odometerVisible, setOdometerVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!motorcycle) return (
    <Screen>
      <Text variant="titleMedium">Motor tidak ditemukan.</Text>
      <Button onPress={() => router.back()}>Kembali</Button>
    </Screen>
  );

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={[styles.content, {
        paddingBottom: Math.max(insets.bottom, 24),
        paddingLeft: Math.max(insets.left, 20),
        paddingRight: Math.max(insets.right, 20),
      }]}>
        <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>Garage</Button>
        <View style={styles.titleRow}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.badgeText, { color: theme.colors.onPrimaryContainer }]}>{motorcycle.model.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.titleCopy}>
            <Text variant="headlineSmall" accessibilityRole="header" style={styles.title}>{motorcycle.nickname}</Text>
            <Text variant="bodyLarge">{motorcycle.brand} {motorcycle.model}</Text>
            {motorcycle.variant || motorcycle.year ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {[motorcycle.variant, motorcycle.year].filter(Boolean).join(' / ')}
              </Text>
            ) : null}
          </View>
        </View>
        <Card mode="outlined" style={[styles.odometer, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="labelLarge">ODOMETER SAAT INI</Text>
            <Text variant="displaySmall" style={styles.title}>
              {motorcycle.currentOdometer.toLocaleString('id-ID')} <Text variant="titleMedium">km</Text>
            </Text>
            <Button mode="outlined" contentStyle={styles.button} onPress={() => setOdometerVisible(true)}>Update odometer</Button>
          </Card.Content>
        </Card>
        <View style={styles.actions}>
          <Button mode="outlined" style={styles.action} contentStyle={styles.button} onPress={() => router.push(`/motorcycle/edit?id=${motorcycle.id}`)}>Edit motor</Button>
          <Button mode="text" style={styles.action} contentStyle={styles.button} textColor={theme.colors.error} onPress={() => { setError(''); setDeleteVisible(true); }}>Hapus motor</Button>
        </View>
        <View style={styles.section}>
          <Text variant="titleLarge">Jadwal perawatan</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {rules.length ? `${rules.length} jadwal aktif untuk motor ini.` : 'Belum ada jadwal perawatan aktif untuk motor ini.'}
          </Text>
        </View>
        {rules.map((rule) => (
          <MaintenanceCard key={rule.id} rule={rule} currentOdometer={motorcycle.currentOdometer} onPress={() => router.push(`/maintenance/${rule.id}`)} />
        ))}
        <OdometerDialog motorcycle={motorcycle} visible={odometerVisible} onDismiss={() => setOdometerVisible(false)} onSave={(value) => updateOdometer(motorcycle.id, value)} />
        <Portal>
          <Dialog visible={deleteVisible} onDismiss={() => { if (!deleting) setDeleteVisible(false); }}>
            <Dialog.Title>Hapus motor?</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                <Text variant="bodyLarge">{motorcycle.nickname}</Text>
                <Text variant="bodyMedium">Riwayat perawatan dan pengingat motor ini juga akan dihapus dari perangkat. Tindakan ini tidak dapat dibatalkan.</Text>
                {error ? <HelperText type="error" accessibilityLiveRegion="polite">{error}</HelperText> : null}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions style={styles.dialogActions}>
              <Button disabled={deleting} onPress={() => setDeleteVisible(false)} contentStyle={styles.button}>Batal</Button>
              <Button disabled={deleting} loading={deleting} textColor={theme.colors.error} contentStyle={styles.button} onPress={async () => {
                if (deleting) return;
                setDeleting(true);
                try {
                  await deleteMotorcycle(motorcycle.id);
                  router.replace('/(tabs)/garage');
                } catch {
                  setError('Motor belum dihapus karena integrasi pengingat belum dibersihkan. Periksa izin notifikasi/kalender lalu coba lagi.');
                } finally {
                  setDeleting(false);
                }
              }}>Hapus motor</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  back: { alignSelf: 'flex-start', marginLeft: -8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
  titleCopy: { flex: 1, gap: 8 },
  badge: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 20, fontWeight: '700' },
  title: { fontWeight: '700' },
  odometer: { marginTop: 24, borderRadius: 20 },
  cardContent: { padding: 20, gap: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginVertical: 24 },
  action: { flexGrow: 1 },
  button: { minHeight: 48 },
  section: { gap: 8, marginBottom: 16 },
  dialogContent: { paddingVertical: 24, gap: 16 },
  dialogActions: { flexWrap: 'wrap', gap: 16 },
});
