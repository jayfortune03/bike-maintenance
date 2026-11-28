import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AccountImportPanel } from '@/src/components/AccountImportPanel';
import { AuthForm } from '@/src/components/AuthForm';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SharedGaragePanel } from '@/src/components/SharedGaragePanel';
import { useAuthSnapshot } from '@/src/auth/AuthProvider';
import { authSession } from '@/src/auth/runtime';
import { SessionStorageError } from '@/src/auth/errors';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

const accountActions = [
  {
    panel: 'shared',
    eyebrow: 'AKSES BERSAMA',
    title: 'Garasi bersama',
    description: 'Terima undangan, lihat motor bersama, dan buka laporan kondisi.',
    icon: 'account-multiple-outline',
  },
  {
    panel: 'import',
    eyebrow: 'GARASI LOKAL',
    title: 'Salin dari Garasi',
    description: 'Pilih motor lokal yang ingin disalin ke akun ini.',
    icon: 'cloud-upload-outline',
  },
] as const;

export default function AccountScreen() {
  const router = useRouter();
  const { notification, panel } = useLocalSearchParams<{ notification?: string; panel?: string }>();
  const theme = useTheme();
  const session = useAuthSnapshot();
  const [logoutNotice, setLogoutNotice] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const selectedPanel = panel === 'shared' || panel === 'import' ? panel : undefined;
  const focusedPanel = session.status === 'signed-in' ? selectedPanel : undefined;
  const header = focusedPanel === 'shared'
    ? { icon: 'account-multiple-outline' as const, title: 'Garasi bersama', description: 'Kelola undangan dan motor yang dibagikan ke akun ini.' }
    : focusedPanel === 'import'
      ? { icon: 'cloud-upload-outline' as const, title: 'Salin dari Garasi', description: 'Pilih salinan tanpa mengubah data di perangkat.' }
      : { icon: 'account-circle-outline' as const, title: 'Akun', description: 'Pilih apa yang ingin dikelola.' };
  const notificationNotice = notification === 'shared-login'
    ? 'Masuk untuk membuka laporan bersama dari notifikasi.'
    : notification === 'unauthorized'
      ? 'Motor dari notifikasi tidak tersedia untuk akun ini.'
      : notification === 'retry'
        ? 'Laporan dari notifikasi belum dapat diperiksa. Periksa koneksi lalu buka lagi.'
        : '';

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutNotice('');
    try {
      const revoked = await authSession.logout();
      if (!revoked) setLogoutNotice('Sesi di perangkat ini sudah dihapus, tetapi server belum dapat dihubungi.');
    } catch (error) {
      if (error instanceof SessionStorageError) setLogoutNotice('Sesi ditutup dari aplikasi, tetapi penyimpanan aman belum dapat dibersihkan. Coba lagi.');
      else throw error;
    } finally {
      setLoggingOut(false);
    }
  };

  let content;
  switch (session.status) {
    case 'loading':
      content = <View style={surface}><Text variant="bodyMedium">Memeriksa sesi aman...</Text></View>;
      break;
    case 'unavailable':
      content = <View style={surface}><EmptyState icon="cloud-alert-outline" title="Sesi belum dapat dibuka" description="Periksa koneksi dan penyimpanan aman perangkat. Garasi lokal tetap tersedia." action="Coba lagi" onPress={() => { void authSession.initialize(true); }} /></View>;
      break;
    case 'signed-out':
      content = <AuthForm notice={notificationNotice || logoutNotice || undefined} />;
      break;
    case 'signed-in':
      if (focusedPanel === 'shared') {
        content = <SharedGaragePanel key={`shared-${session.user.id}`} userId={session.user.id} />;
      } else if (focusedPanel === 'import') {
        content = <AccountImportPanel key={session.user.id} user={session.user} />;
      } else {
        content = (
          <>
            <View style={[surface, styles.identity]}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.identityIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={SPACING.xxl} color={theme.colors.onPrimaryContainer} />
              </View>
              <View style={styles.copy}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>AKUN AKTIF</Text>
                <Text
                  accessibilityLabel={`Akun aktif ${session.user.email}`}
                  variant="titleLarge"
                  selectable
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={styles.email}
                >
                  {session.user.email}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Garasi lokal tetap terpisah dan tersimpan di perangkat.</Text>
              </View>
            </View>
            {notificationNotice ? <HelperText type="info" visible accessibilityLiveRegion="polite">{notificationNotice}</HelperText> : null}

            <View accessibilityRole="menu" accessibilityLabel="Menu akun" style={styles.menu}>
              {accountActions.map((action) => (
                <Pressable
                  key={action.panel}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.title}. ${action.description}`}
                  accessibilityHint="Buka submenu akun"
                  onPress={() => router.push({ pathname: '/account', params: notification ? { panel: action.panel, notification } : { panel: action.panel } })}
                  style={({ pressed }) => [
                    styles.menuItem,
                    CARD_SHADOW,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.78 : 1 },
                  ]}
                >
                  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.menuIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name={action.icon} size={SPACING.xxl} color={theme.colors.onPrimaryContainer} />
                  </View>
                  <View style={styles.copy}>
                    <Text variant="labelSmall" style={{ color: theme.colors.primary }}>{action.eyebrow}</Text>
                    <Text variant="titleMedium" style={styles.menuTitle}>{action.title}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{action.description}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={SPACING.xxl} color={theme.colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </View>

            {logoutNotice ? <HelperText type="info" visible accessibilityLiveRegion="polite">{logoutNotice}</HelperText> : null}
            <Button mode="outlined" icon="logout" loading={loggingOut} disabled={loggingOut} onPress={logout} contentStyle={styles.button} style={styles.logout}>Keluar dari akun</Button>
          </>
        );
      }
      break;
    default: {
      const unreachable: never = session;
      content = unreachable;
    }
  }

  return (
    <Screen>
      <Button
        icon="arrow-left"
        onPress={() => {
          if (focusedPanel) {
            if (notification) router.replace({ pathname: '/account', params: { notification } });
            else router.replace('/account');
          } else {
            router.replace('/settings');
          }
        }}
        contentStyle={styles.button}
        style={styles.back}
      >
        {focusedPanel ? 'Kembali ke Akun' : 'Kembali ke Pengaturan'}
      </Button>
      <ScreenHeader icon={header.icon} title={header.title} description={header.description} />
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  back: { alignSelf: 'flex-start', marginBottom: SPACING.md, marginLeft: -SPACING.sm },
  button: { minHeight: SPACING.touch },
  copy: { flex: 1, minWidth: 0 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  identityIcon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  email: { marginTop: SPACING.xs, marginBottom: SPACING.xs },
  menu: { gap: SPACING.md, marginTop: SPACING.xxl },
  menuItem: { minHeight: SPACING.touch * 2 + SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg },
  menuIcon: { width: SPACING.touch, height: SPACING.touch, flexShrink: 0, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { marginTop: SPACING.xs, marginBottom: SPACING.xs },
  logout: { marginTop: SPACING.xxl, alignSelf: 'flex-start' },
});
