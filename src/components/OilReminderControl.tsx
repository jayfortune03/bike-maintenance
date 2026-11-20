import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { Card, HelperText, Switch, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { notificationPermissionStatus, requestNotificationPermission, type NotificationPermissionStatus } from '@/src/services/notifications';
import { useAppStore } from '@/src/store/app.store';
import { CARD_SHADOW } from '@/src/theme/theme';

export function OilReminderControl({ ruleId }: { readonly ruleId: string }) {
  const theme = useTheme();
  const rule = useAppStore((state) => state.maintenanceRules.find((item) => item.id === ruleId));
  const preference = useAppStore((state) => state.preferences.oilReminders[ruleId]);
  const setEnabled = useAppStore((state) => state.setOilReminderEnabled);
  const [permission, setPermission] = useState<NotificationPermissionStatus>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshPermission = async () => setPermission(await notificationPermissionStatus());
  useEffect(() => {
    const refresh = () => { void refreshPermission().catch(() => setError('Status izin notifikasi tidak dapat dibaca.')); };
    refresh();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => listener.remove();
  }, []);

  if (!rule || rule.type !== 'engine-oil') return null;
  const enabled = preference?.enabled === true;
  const tracked = (rule.intervalDays !== undefined && rule.lastCompletedAt !== undefined) || (rule.intervalKm !== undefined && rule.lastCompletedKm !== undefined);
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (!enabled && !(await requestNotificationPermission())) {
        await refreshPermission();
        setError('Izin notifikasi belum diberikan. Aktifkan melalui pengaturan perangkat.');
        return;
      }
      await setEnabled(ruleId, !enabled);
      await refreshPermission();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pengingat oli tidak dapat diubah.');
    } finally {
      setBusy(false);
    }
  };

  if (Platform.OS === 'web') return (
    <Card mode="outlined" style={[styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>Notifikasi otomatis</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Notifikasi jatuh tempo oli tersedia di aplikasi Android/iOS, bukan preview web.</Text>
      </Card.Content>
    </Card>
  );

  const status = preference?.error ?? error;
  return (
    <Card mode="outlined" style={[styles.card, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <TouchableRipple disabled={busy} onPress={toggle} accessibilityRole="switch" accessibilityState={{ checked: enabled, disabled: busy }} accessibilityLabel="Notifikasi otomatis ganti oli">
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text variant="titleMedium" style={styles.title}>Notifikasi otomatis</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {tracked ? 'Ingatkan saat tanggal atau odometer oli mencapai batas.' : 'Aktifkan sekarang; jadwal dimulai setelah riwayat ganti oli dicatat.'}
            </Text>
          </View>
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Switch accessible={false} focusable={false} value={enabled} disabled={busy} />
          </View>
        </View>
      </TouchableRipple>
      <Card.Content style={styles.status}>
        <HelperText type={status ? 'error' : 'info'} accessibilityLiveRegion="polite">
          {status || `${enabled ? 'Aktif' : 'Nonaktif'} · Izin: ${permission?.label ?? 'Memeriksa…'}`}
        </HelperText>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20 },
  content: { padding: 16, gap: 8 },
  row: { minHeight: 64, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  copy: { flex: 1, gap: 4 },
  title: { fontWeight: '700' },
  status: { paddingHorizontal: 16, paddingBottom: 8 },
});
