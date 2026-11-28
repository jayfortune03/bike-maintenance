import { useCallback, useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Button, HelperText, IconButton, Text, TextInput, TouchableRipple, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ConditionReport, RemoteMotorcycle } from '@/src/auth/contracts';
import { motorcycleInvitationRequestSchema } from '@/src/auth/contracts';
import { useAuthSnapshot } from '@/src/auth/AuthProvider';
import { ApiClientError, SessionExpiredError, StaleSessionError } from '@/src/auth/errors';
import { accountApi, authSession } from '@/src/auth/runtime';
import { Screen } from '@/src/components/Screen';
import { SectionTitle } from '@/src/components/SectionTitle';
import { Sheet } from '@/src/components/Sheet';
import { formatIntegerInput, parseIntegerInput } from '@/src/domain/integer-input';
import { currentMembershipRole } from '@/src/domain/shared-motorcycle';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

const fuelOptions = [0, 1, 2, 3, 4, 5, 6] as const;

export default function SharedMotorcycleScreen() {
  const { id, reportId } = useLocalSearchParams<{ id: string; reportId?: string }>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useAuthSnapshot();
  const request = useRef(0);
  const [motorcycle, setMotorcycle] = useState<RemoteMotorcycle>();
  const [reports, setReports] = useState<readonly ConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [conditionVisible, setConditionVisible] = useState(false);
  const [odometer, setOdometer] = useState('');
  const [fuelBars, setFuelBars] = useState(6);
  const [note, setNote] = useState('');
  const [conditionError, setConditionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  const owner = motorcycle ? currentMembershipRole(motorcycle) === 'OWNER' : false;

  const refresh = useCallback(async () => {
    if (session.status !== 'signed-in') return;
    const accountId = session.user.id;
    const currentRequest = ++request.current;
    setLoading(true);
    setLoadError('');
    try {
      const motorcycles = await accountApi.listMotorcycles();
      if (currentRequest !== request.current || authSession.accountId !== accountId) return;
      const authorized = motorcycles.find((item) => item.id === id);
      if (!authorized) {
        setMotorcycle(undefined);
        setReports([]);
        setLoadError('Motor ini tidak tersedia untuk akun yang sedang masuk.');
        return;
      }
      const nextReports = await accountApi.listReports(authorized.id);
      if (currentRequest !== request.current || authSession.accountId !== accountId) return;
      setMotorcycle(authorized);
      setReports(nextReports);
      if (reportId && !nextReports.some((report) => report.id === reportId)) setNotice('Laporan dari notifikasi tidak lagi tersedia dalam riwayat terbaru.');
    } catch (error) {
      if (currentRequest !== request.current || authSession.accountId !== accountId || error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setLoadError(error instanceof ApiClientError && error.kind === 'network' ? 'Riwayat bersama belum dapat dijangkau. Coba lagi.' : 'Riwayat bersama belum dapat dimuat.');
      else throw error;
    } finally {
      if (currentRequest === request.current && authSession.accountId === accountId) setLoading(false);
    }
  }, [id, reportId, session]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { ++request.current; };
  }, [refresh]));

  useEffect(() => {
    if (session.status === 'signed-out' || session.status === 'unavailable') router.replace('/account');
  }, [router, session.status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active' && isFocused) void refresh(); });
    return () => subscription.remove();
  }, [isFocused, refresh]);

  const saveReport = async () => {
    const odometerKm = parseIntegerInput(odometer);
    if (!motorcycle || saving) return;
    if (odometerKm === undefined || !Number.isSafeInteger(odometerKm) || odometerKm < 0 || odometerKm > 2_147_483_647) {
      setConditionError('Masukkan odometer berupa angka bulat antara 0 dan 2.147.483.647 km.');
      return;
    }
    setSaving(true);
    setConditionError('');
    try {
      await accountApi.createReport(motorcycle.id, { odometerKm, fuelBars, note });
      if (authSession.accountId !== (session.status === 'signed-in' ? session.user.id : undefined)) return;
      setConditionVisible(false);
      setNotice('Kondisi motor berhasil dibagikan.');
      await refresh();
    } catch (error) {
      if (error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setConditionError('Kondisi belum dapat disimpan. Periksa koneksi lalu coba lagi.');
      else throw error;
    } finally {
      setSaving(false);
    }
  };

  const invite = async () => {
    if (!motorcycle || inviting) return;
    const parsed = motorcycleInvitationRequestSchema.safeParse({ email: inviteEmail });
    if (!parsed.success) {
      setInviteMessage('Masukkan alamat email yang valid.');
      return;
    }
    setInviting(true);
    setInviteMessage('');
    try {
      await accountApi.inviteMotorcycle(motorcycle.id, parsed.data.email);
      setInviteEmail('');
      setInviteMessage(`Undangan dikirim ke ${parsed.data.email}.`);
    } catch (error) {
      if (error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setInviteMessage('Undangan belum dapat dikirim. Periksa email atau coba lagi.');
      else throw error;
    } finally {
      setInviting(false);
    }
  };

  if (session.status === 'loading') return <Screen><HelperText type="info" visible>Memeriksa akun...</HelperText></Screen>;

  return (
    <Screen>
      <Button icon="arrow-left" onPress={() => router.back()} contentStyle={styles.button} style={styles.back}>Garasi bersama</Button>
      {loading && !motorcycle ? <View style={surface}><HelperText type="info" visible>Memeriksa akses dan memuat riwayat...</HelperText></View> : null}
      {loadError ? <View style={surface}><HelperText type="error" visible accessibilityRole="alert">{loadError}</HelperText><Button onPress={() => { void refresh(); }} contentStyle={styles.button}>Coba lagi</Button></View> : null}
      {motorcycle ? (
        <>
          <View style={[surface, styles.hero]}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.heroIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="motorbike" size={30} color={theme.colors.onPrimaryContainer} />
            </View>
            <View style={styles.copy}>
              <Text accessibilityRole="header" variant="headlineSmall">{motorcycle.name}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.odometerKm.toLocaleString('id-ID')} km · {owner ? 'Pemilik' : 'Anggota'}</Text>
            </View>
            <Button mode="contained" icon="clipboard-plus-outline" onPress={() => {
              setOdometer(formatIntegerInput(String(motorcycle.odometerKm)));
              setFuelBars(6);
              setNote('');
              setConditionError('');
              setConditionVisible(true);
            }} contentStyle={styles.button}>Catat kondisi</Button>
          </View>
          {notice ? <HelperText type="info" visible accessibilityLiveRegion="polite">{notice}</HelperText> : null}

          {owner ? <><SectionTitle description="Pemilik dapat mengundang anggota lewat email.">Undang anggota</SectionTitle><View style={surface}>
            <TextInput label="Email anggota" mode="outlined" value={inviteEmail} onChangeText={(value) => { setInviteEmail(value); setInviteMessage(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" disabled={inviting} error={!!inviteMessage && !inviteMessage.includes('dikirim')} />
            {inviteMessage ? <HelperText type={inviteMessage.includes('dikirim') ? 'info' : 'error'} visible accessibilityRole="alert" accessibilityLiveRegion="polite">{inviteMessage}</HelperText> : null}
            <Button mode="outlined" icon="account-plus-outline" loading={inviting} disabled={inviting} onPress={() => { void invite(); }} contentStyle={styles.button} style={styles.inviteButton}>Kirim undangan</Button>
          </View></> : null}

          <SectionTitle description="Laporan terbaru dari semua anggota." action="Muat ulang" onAction={() => { void refresh(); }}>Riwayat kondisi</SectionTitle>
          {loading ? <HelperText type="info" visible>Memperbarui riwayat...</HelperText> : null}
          {!loading && !reports.length ? <View style={surface}><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Belum ada laporan kondisi. Catat odometer, bensin, dan catatan pertama.</Text></View> : null}
          <View style={styles.reports}>
            {reports.map((report) => {
              const highlighted = report.id === reportId;
              return <View key={report.id} style={[styles.report, CARD_SHADOW, { backgroundColor: highlighted ? theme.colors.primaryContainer : theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <View style={styles.reportHeading}><View style={styles.copy}><Text variant="titleMedium">{report.odometerKm.toLocaleString('id-ID')} km</Text><Text variant="bodySmall" style={{ color: highlighted ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{new Date(report.createdAt).toLocaleString('id-ID')} · {report.authorEmail}</Text></View>{highlighted ? <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>DARI NOTIFIKASI</Text> : null}</View>
                <View style={styles.fuel}><MaterialCommunityIcons name="fuel" size={20} color={highlighted ? theme.colors.onPrimaryContainer : theme.colors.primary} /><Text variant="labelLarge" style={{ color: highlighted ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>Bensin {report.fuelBars}/6</Text></View>
                <Text variant="bodyMedium" style={{ color: highlighted ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{report.note.trim() || 'Tidak ada catatan tambahan.'}</Text>
              </View>;
            })}
          </View>
        </>
      ) : null}

      <Sheet visible={conditionVisible} onDismiss={() => { if (!saving) setConditionVisible(false); }}>
        <View style={styles.sheetHeading}><Text accessibilityRole="header" variant="titleLarge" style={styles.copy}>Catat kondisi</Text><IconButton icon="close" accessibilityLabel="Tutup catatan kondisi" disabled={saving} onPress={() => setConditionVisible(false)} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, SPACING.xxl) }]}>
          <TextInput label="Odometer" mode="outlined" value={odometer} onChangeText={(value) => { setOdometer(formatIntegerInput(value)); setConditionError(''); }} keyboardType="number-pad" disabled={saving} error={!!conditionError} right={<TextInput.Affix text="km" />} />
          <View><Text variant="titleSmall">Bensin tersisa</Text><View accessibilityRole="radiogroup" accessibilityLabel="Bensin tersisa dari nol sampai enam bar" style={styles.fuelOptions}>{fuelOptions.map((value) => <TouchableRipple key={value} accessibilityRole="radio" accessibilityState={{ checked: fuelBars === value, disabled: saving }} disabled={saving} onPress={() => setFuelBars(value)} style={[styles.fuelOption, { backgroundColor: fuelBars === value ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}><Text variant="labelLarge" style={{ color: fuelBars === value ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{value}</Text></TouchableRipple>)}</View></View>
          <TextInput label="Catatan" mode="outlined" value={note} onChangeText={setNote} multiline numberOfLines={4} disabled={saving} />
          {conditionError ? <HelperText type="error" visible accessibilityRole="alert" accessibilityLiveRegion="polite">{conditionError}</HelperText> : null}
          <Button mode="contained" icon="send-outline" loading={saving} disabled={saving} onPress={() => { void saveReport(); }} contentStyle={styles.button}>Bagikan kondisi</Button>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  back: { alignSelf: 'flex-start', marginBottom: SPACING.md, marginLeft: -SPACING.sm },
  button: { minHeight: SPACING.touch },
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.lg, borderRadius: RADII.featured, padding: SPACING.xxl },
  heroIcon: { width: 64, height: 64, borderRadius: RADII.card, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  inviteButton: { alignSelf: 'flex-start' },
  reports: { gap: SPACING.md },
  report: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl, gap: SPACING.md },
  reportHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: SPACING.md },
  fuel: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', paddingLeft: SPACING.xxl, paddingRight: SPACING.sm, paddingVertical: SPACING.lg },
  sheetContent: { paddingHorizontal: SPACING.xxl, gap: SPACING.xxl },
  fuelOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  fuelOption: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
