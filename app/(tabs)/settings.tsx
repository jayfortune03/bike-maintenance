import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Dialog, Portal, Switch, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionTitle } from '@/src/components/SectionTitle';
import { notificationPermissionLabel } from '@/src/services/notifications';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW, LAYOUT, RADII, SPACING } from '@/src/theme/theme';

const themeModes = [
  { value: 'system', label: 'Sistem', icon: 'cellphone-cog' },
  { value: 'light', label: 'Terang', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Gelap', icon: 'moon-waning-crescent' },
] as const;

export default function SettingsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= LAYOUT.wideBreakpoint;
  const preferences = useAppStore((state) => state.preferences);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccent = useAppStore((state) => state.setUseMotorcycleAccent);
  const resetData = useAppStore((state) => state.resetData);
  const [resetVisible, setResetVisible] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [permission, setPermission] = useState('Memeriksa izin...');
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const muted = { color: theme.colors.onSurfaceVariant };

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void notificationPermissionLabel()
        .then((label) => { if (active) setPermission(label); })
        .catch(() => { if (active) setPermission('Status izin tidak dapat dibaca'); });
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { active = false; subscription.remove(); };
  }, []);

  const openDeviceSettings = async () => {
    setSettingsError(false);
    try {
      await Linking.openSettings();
    } catch {
      setSettingsError(true);
    }
  };

  return (
    <Screen>
      <ScreenHeader icon="cog-outline" title="Pengaturan" description="Atur tampilan, izin perangkat, dan data lokal." />

      <View style={[styles.grid, wide && styles.gridWide]}>
        <View style={styles.column}>
          <SectionTitle description="Tema tetap mengikuti preferensi perangkat jika dipilih.">Tampilan</SectionTitle>
          <View style={surface}>
            <Text variant="titleSmall">Mode warna</Text>
            <View style={styles.themeOptions} accessibilityRole="radiogroup" accessibilityLabel="Mode warna">
              {themeModes.map(({ value, label, icon }) => {
                const selected = preferences.themeMode === value;
                return (
                  <TouchableRipple
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setThemeMode(value)}
                    style={[styles.themeOption, { backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}
                  >
                    <View style={styles.themeOptionContent}>
                      <MaterialCommunityIcons name={selected ? 'check-circle' : icon} size={20} color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                      <Text variant="labelLarge" style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{label}</Text>
                    </View>
                  </TouchableRipple>
                );
              })}
            </View>

            <TouchableRipple
              accessibilityRole="switch"
              accessibilityLabel="Warna motor aktif"
              accessibilityHint="Aksen aplikasi mengikuti warna motor yang dipilih."
              accessibilityState={{ checked: preferences.useMotorcycleAccent }}
              onPress={() => setAccent(!preferences.useMotorcycleAccent)}
              style={[styles.settingRow, styles.divided, { borderTopColor: theme.colors.outlineVariant }]}
            >
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="palette-outline" size={22} color={theme.colors.onSurfaceVariant} /></View>
                <View style={styles.copy}>
                  <Text variant="titleSmall">Warna motor aktif</Text>
                  <Text variant="bodyMedium" style={[muted, styles.detail]}>Aksen mengikuti motor yang sedang dipilih.</Text>
                </View>
                <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Switch accessible={false} focusable={false} value={preferences.useMotorcycleAccent} /></View>
              </View>
            </TouchableRipple>
          </View>
        </View>

        <View style={styles.column}>
          <SectionTitle description="Notifikasi dikelola oleh sistem perangkat.">Perangkat & privasi</SectionTitle>
          <View style={surface}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.onPrimaryContainer} /></View>
              <View style={styles.copy}>
                <Text variant="titleSmall">Izin notifikasi</Text>
                <Text variant="bodyMedium" style={[muted, styles.detail]}>{permission}</Text>
              </View>
            </View>
            <Button icon="open-in-new" mode="outlined" onPress={openDeviceSettings} contentStyle={styles.button} style={styles.deviceButton}>Buka pengaturan perangkat</Button>
            {settingsError ? <Text variant="bodyMedium" accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.message, { color: theme.colors.error }]}>Pengaturan perangkat tidak dapat dibuka. Buka secara manual dari perangkat kamu.</Text> : null}

            <View style={[styles.row, styles.divided, { borderTopColor: theme.colors.outlineVariant }]}>
              <View style={[styles.rowIcon, { backgroundColor: theme.colors.surfaceVariant }]}><MaterialCommunityIcons name="shield-lock-outline" size={22} color={theme.colors.onSurfaceVariant} /></View>
              <View style={styles.copy}>
                <Text variant="titleSmall">Privasi lokal</Text>
                <Text variant="bodyMedium" style={[muted, styles.detail]}>Data tersimpan di perangkat ini, tanpa akun dan tanpa server.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <SectionTitle description="Tindakan ini menghapus seluruh catatan dari perangkat.">Data aplikasi</SectionTitle>
      <View style={[surface, styles.dataCard]}>
        <View style={styles.copy}>
          <Text variant="titleMedium">Mulai dari awal</Text>
          <Text variant="bodyMedium" style={[muted, styles.detail]}>Motor, riwayat, jadwal, dan pengingat akan dihapus setelah integrasi perangkat berhasil dibersihkan.</Text>
        </View>
        <Button mode="outlined" textColor={theme.colors.error} onPress={() => setResetVisible(true)} contentStyle={styles.button}>Reset data aplikasi</Button>
      </View>

      <Text variant="bodySmall" style={[styles.about, muted]}>Motor Care membantu kamu merawat motor tanpa mengirim data ke server.</Text>

      <Portal>
        <Dialog visible={resetVisible} onDismiss={() => { if (!resetting) setResetVisible(false); }} style={styles.dialog}>
          <Dialog.Title>Reset semua data?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Semua motor, riwayat, dan pengingat akan dihapus. Pengaturan tampilan juga kembali ke awal. Tindakan ini tidak dapat dibatalkan.</Text>
            {resetError ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: theme.colors.error }]}>{resetError}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button disabled={resetting} onPress={() => setResetVisible(false)} contentStyle={styles.button}>Batal</Button>
            <Button loading={resetting} disabled={resetting} textColor={theme.colors.error} contentStyle={styles.button} onPress={async () => {
              if (resetting) return;
              setResetting(true);
              setResetError('');
              try {
                await resetData();
                setResetVisible(false);
              } catch {
                setResetError('Data belum dihapus karena notifikasi atau kalender belum dibersihkan. Periksa izin perangkat dan coba lagi.');
              } finally {
                setResetting(false);
              }
            }}>Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  grid: { gap: SPACING.lg },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0 },
  copy: { flex: 1, minWidth: 0 },
  themeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.lg },
  themeOption: { flexGrow: 1, flexBasis: 92, minHeight: SPACING.touch, borderRadius: RADII.control, overflow: 'hidden' },
  themeOptionContent: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.sm },
  settingRow: { marginTop: SPACING.xl },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rowIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  detail: { marginTop: SPACING.xs },
  divided: { marginTop: SPACING.xl, paddingTop: SPACING.xl, borderTopWidth: 1 },
  button: { minHeight: SPACING.touch },
  deviceButton: { marginTop: SPACING.lg },
  message: { marginTop: SPACING.md },
  dataCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.xl },
  about: { textAlign: 'center', marginTop: SPACING.xxl },
  dialog: { width: '90%', maxWidth: 480, alignSelf: 'center' },
  dialogActions: { flexWrap: 'wrap' },
});
