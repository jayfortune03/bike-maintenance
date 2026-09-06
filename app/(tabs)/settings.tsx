import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Button,
  Card,
  Dialog,
  Portal,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { Screen } from '@/src/components/Screen';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';
import { notificationPermissionLabel } from '@/src/services/notifications';

export default function SettingsScreen() {
  const theme = useTheme();
  const preferences = useAppStore((state) => state.preferences);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccent = useAppStore((state) => state.setUseMotorcycleAccent);
  const resetData = useAppStore((state) => state.resetData);
  const [resetVisible, setResetVisible] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [permission, setPermission] = useState('Memeriksa izin...');
  useEffect(() => {
    let active = true;
    const refresh = () => { void notificationPermissionLabel().then((label) => { if (active) setPermission(label); }).catch(() => { if (active) setPermission('Status izin tidak dapat dibaca'); }); };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { active = false; subscription.remove(); };
  }, []);
  const cardStyle = [
    styles.card,
    CARD_SHADOW,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
    },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={24}
            color={theme.colors.onPrimaryContainer}
          />
        </View>
        <View style={styles.copy}>
          <Text
            variant="headlineSmall"
            accessibilityRole="header"
            style={styles.title}
          >
            Pengaturan
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Sesuaikan tampilan dan cara kerja Motor Care.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          accessibilityRole="header"
          style={styles.sectionTitle}
        >
          Tampilan
        </Text>
        <Card mode="outlined" style={cardStyle}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={styles.label}>
              Mode warna
            </Text>
            <View
              style={styles.themeOptions}
              accessibilityRole="radiogroup"
              accessibilityLabel="Mode warna"
            >
              {([
                { value: 'system', label: 'Sistem' },
                { value: 'light', label: 'Terang' },
                { value: 'dark', label: 'Gelap' },
              ] as const).map(({ value, label }) => (
                <TouchableRipple
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: preferences.themeMode === value }}
                  onPress={() => setThemeMode(value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor:
                        preferences.themeMode === value
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                      borderColor:
                        preferences.themeMode === value
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          preferences.themeMode === value
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableRipple>
              ))}
            </View>
            <TouchableRipple
              accessibilityRole="switch"
              accessibilityLabel="Warna motor aktif"
              accessibilityHint="Aksen aplikasi mengikuti warna motor yang dipilih."
              accessibilityState={{ checked: preferences.useMotorcycleAccent }}
              onPress={() => setAccent(!preferences.useMotorcycleAccent)}
              style={[
                styles.accentSetting,
                { borderTopColor: theme.colors.outlineVariant },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text variant="titleSmall" style={styles.rowTitle}>
                    Warna motor aktif
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Aksen aplikasi mengikuti warna motor yang dipilih.
                  </Text>
                </View>
                <View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Switch
                    accessible={false}
                    focusable={false}
                    value={preferences.useMotorcycleAccent}
                  />
                </View>
              </View>
            </TouchableRipple>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          accessibilityRole="header"
          style={styles.sectionTitle}
        >
          Data aplikasi
        </Text>
        <Card mode="outlined" style={cardStyle}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.settingLine}>
              <View
                style={[
                  styles.lineIcon,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <MaterialCommunityIcons
                  name="cellphone-lock"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.copy}>
                <Text variant="titleSmall" style={styles.rowTitle}>
                  Privasi lokal
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}
                >
                  Data tersimpan di perangkat ini.
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={() => setResetVisible(true)}
              contentStyle={styles.buttonContent}
              style={[styles.reset, { borderColor: theme.colors.outlineVariant }]}
            >
              Reset data aplikasi
            </Button>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          accessibilityRole="header"
          style={styles.sectionTitle}
        >
          Tentang
        </Text>
        <Card mode="outlined" style={cardStyle}>
          <Card.Content style={styles.cardContent}>
            <Text
              variant="bodyMedium"
              style={[styles.about, { color: theme.colors.onSurfaceVariant }]}
            >
              Motor Care membantu kamu menjaga motor tetap siap dipakai, tanpa akun
              dan tanpa mengirim data ke server.
            </Text>
            <Text variant="titleSmall">Notifikasi: {permission}</Text>
            <TouchableRipple
              accessibilityRole="button"
              onPress={async () => {
                setSettingsError(false);
                try {
                  await Linking.openSettings();
                } catch {
                  setSettingsError(true);
                }
              }}
              style={styles.settingsButton}
            >
              <View style={styles.settingsButtonContent}>
                <MaterialCommunityIcons
                  name="open-in-new"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  variant="labelLarge"
                  style={[styles.copy, { color: theme.colors.primary }]}
                >
                  Buka pengaturan perangkat
                </Text>
              </View>
            </TouchableRipple>
            {settingsError ? (
              <Text
                variant="bodyMedium"
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.muted, { color: theme.colors.error }]}
              >
                Pengaturan perangkat tidak dapat dibuka. Buka melalui menu
                pengaturan perangkat atau browser kamu.
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      </View>

      <Portal>
        <Dialog
          visible={resetVisible}
          onDismiss={() => { if (!resetting) setResetVisible(false); }}
          style={styles.dialog}
        >
          <Dialog.Title>Reset semua data?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Semua motor, riwayat, dan pengingat akan dihapus dari perangkat ini.
              Pengaturan tampilan juga akan dikembalikan ke awal. Tindakan ini
              tidak dapat dibatalkan.
            </Text>
            {resetError ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>{resetError}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              disabled={resetting}
              onPress={() => setResetVisible(false)}
              contentStyle={styles.buttonContent}
            >
              Batal
            </Button>
            <Button
              loading={resetting}
              disabled={resetting}
              textColor={theme.colors.error}
              contentStyle={styles.buttonContent}
              onPress={async () => {
                if (resetting) return;
                setResetting(true);
                setResetError('');
                try { await resetData(); setResetVisible(false); }
                catch { setResetError('Data belum dihapus karena notifikasi/kalender belum dibersihkan. Periksa izin perangkat dan coba lagi.'); }
                finally { setResetting(false); }
              }}
            >
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    lineHeight: 22,
  },
  section: {
    marginTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
  },
  cardContent: {
    paddingVertical: 24,
  },
  label: {
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOption: {
    flexGrow: 1,
    flexBasis: 80,
    minHeight: 48,
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionLabel: {
    textAlign: 'center',
  },
  accentSetting: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 48,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontWeight: '600',
  },
  muted: {
    marginTop: 4,
    lineHeight: 22,
  },
  settingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lineIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reset: {
    marginTop: 24,
  },
  about: {
    lineHeight: 22,
  },
  buttonContent: {
    minHeight: 48,
  },
  settingsButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 48,
    paddingVertical: 8,
  },
  dialog: {
    width: '90%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  dialogActions: {
    flexWrap: 'wrap',
  },
});
