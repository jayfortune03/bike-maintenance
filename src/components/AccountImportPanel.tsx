import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as z from 'zod';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { accountApi, authSession } from '@/src/auth/runtime';
import type { RemoteMotorcycle, SessionUser } from '@/src/auth/contracts';
import { ApiClientError, SessionExpiredError, StaleSessionError } from '@/src/auth/errors';
import { SectionTitle } from '@/src/components/SectionTitle';
import { useAppStore } from '@/src/store/app.store';
import { buildImportPlan, selectImportCandidates, type ImportCandidate, type ImportFailure } from '@/src/import/local-import';
import { importLedger, localImportRunner } from '@/src/import/runtime';
import { ImportLedgerError } from '@/src/import/import-ledger';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

function loadError(error: ApiClientError | z.ZodError | ImportLedgerError): string {
  if (error instanceof ImportLedgerError) return 'Riwayat unggahan lokal tidak dapat dibaca. Impor dihentikan agar motor tidak dikirim dua kali.';
  if (error instanceof z.ZodError) return 'Daftar motor dari server tidak dapat dibaca.';
  if (error.kind === 'configuration') return 'Alamat API belum dikonfigurasi untuk aplikasi ini.';
  if (error.kind === 'network') return 'API tidak dapat dihubungi. Data lokal tetap aman.';
  return 'Daftar akun belum dapat dimuat.';
}

export function AccountImportPanel({ user }: { readonly user: SessionUser }) {
  const theme = useTheme();
  const motorcycles = useAppStore((state) => state.motorcycles);
  const [imported, setImported] = useState<Readonly<Record<string, string>>>({});
  const [remoteMotorcycles, setRemoteMotorcycles] = useState<readonly RemoteMotorcycle[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState('');
  const [accountFailure, setAccountFailure] = useState('');
  const [selectedLocalIds, setSelectedLocalIds] = useState<readonly string[]>([]);
  const [pending, setPending] = useState<readonly ImportCandidate[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [failed, setFailed] = useState<readonly ImportFailure[]>([]);
  const remoteRequest = useRef(0);
  const plan = useMemo(() => buildImportPlan(motorcycles, imported), [motorcycles, imported]);
  const selected = useMemo(() => selectImportCandidates(plan.ready, selectedLocalIds), [plan.ready, selectedLocalIds]);
  const readyById = useMemo(() => new Map(plan.ready.map((item) => [item.localId, item])), [plan.ready]);
  const invalidById = useMemo(() => new Map(plan.invalid.map((item) => [item.localId, item])), [plan.invalid]);
  const failedById = useMemo(() => new Map(failed.map((item) => [item.localId, item])), [failed]);
  const importedCount = motorcycles.filter((motorcycle) => imported[motorcycle.id]).length;
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  const loadRemoteMotorcycles = useCallback(async () => {
    const request = ++remoteRequest.current;
    setAccountLoading(true);
    setAccountFailure('');
    setRemoteMotorcycles([]);
    try {
      const remote = await accountApi.listMotorcycles();
      if (request === remoteRequest.current && authSession.accountId === user.id) setRemoteMotorcycles(remote);
    } catch (error) {
      if (request !== remoteRequest.current || authSession.accountId !== user.id || error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setAccountFailure(loadError(error));
      else throw error;
    } finally {
      if (request === remoteRequest.current && authSession.accountId === user.id) setAccountLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    let ignore = false;
    setImported({});
    setRemoteMotorcycles([]);
    setSelectedLocalIds([]);
    setPending([]);
    setConfirmVisible(false);
    setImporting(false);
    setFailed([]);
    setLedgerLoading(true);
    setLoadFailure('');
    setAccountFailure('');
    void loadRemoteMotorcycles();
    const load = async () => {
      try {
        const stored = await importLedger.getAccount(user.id);
        if (ignore) return;
        if (authSession.accountId !== user.id) return;
        setImported(stored);
      } catch (error) {
        if (ignore) return;
        if (authSession.accountId !== user.id) return;
        if (error instanceof ImportLedgerError) setLoadFailure(loadError(error));
        else throw error;
      } finally {
        if (!ignore && authSession.accountId === user.id) setLedgerLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
      ++remoteRequest.current;
    };
  }, [loadRemoteMotorcycles, user.id]);

  const openConfirmation = (items: readonly ImportCandidate[]) => {
    setPending(items);
    setConfirmVisible(true);
  };

  const upload = async () => {
    if (!pending.length || importing) return;
    setConfirmVisible(false);
    setImporting(true);
    setAccountFailure('');
    try {
      const result = await localImportRunner.run(user.id, pending);
      switch (result.kind) {
        case 'discarded':
          return;
        case 'complete':
          if (authSession.accountId !== user.id) return;
          setSelectedLocalIds([]);
          setFailed((current) => [
            ...current.filter((item) => !pending.some((candidate) => candidate.localId === item.localId)),
            ...result.failed,
          ]);
          if (result.refreshError) {
            setRemoteMotorcycles([]);
            setAccountFailure(result.refreshError);
          } else {
            setRemoteMotorcycles(result.remoteMotorcycles);
          }
          break;
        default: {
          const unreachable: never = result;
          return unreachable;
        }
      }
      const stored = await importLedger.getAccount(user.id);
      if (authSession.accountId === user.id) setImported(stored);
    } catch (error) {
      if (error instanceof ImportLedgerError) setLoadFailure(loadError(error));
      else throw error;
    } finally {
      if (authSession.accountId === user.id) setImporting(false);
    }
  };

  return (
    <>
      <SectionTitle description="Motor lokal tidak berubah setelah diunggah.">Salin motor dari Garasi</SectionTitle>
      <View style={surface}>
        <View style={styles.disclosure}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={theme.colors.onPrimaryContainer} />
          </View>
          <View style={styles.copy}>
            <Text variant="titleMedium">Garasi tetap lokal</Text>
            <Text variant="bodyMedium" style={[styles.detail, { color: theme.colors.onSurfaceVariant }]}>Hanya nama dan odometer saat ini yang disalin. Riwayat servis tetap di perangkat ini.</Text>
          </View>
        </View>

        <View style={[styles.summary, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="titleSmall">{importedCount} dari {motorcycles.length} motor lokal sudah tercatat untuk akun ini</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{remoteMotorcycles.length} motor tersedia di akun {user.email}</Text>
        </View>

        {ledgerLoading ? <HelperText type="info" visible>Memuat status akun...</HelperText> : null}
        {loadFailure ? <HelperText type="error" visible accessibilityRole="alert">{loadFailure}</HelperText> : null}

        <View style={styles.localList}>
          {motorcycles.map((motorcycle) => {
            const alreadyImported = imported[motorcycle.id] !== undefined;
            const failure = failedById.get(motorcycle.id);
            const invalid = invalidById.get(motorcycle.id);
            const candidate = readyById.get(motorcycle.id);
            const isSelected = selectedLocalIds.includes(motorcycle.id);
            const selectable = candidate !== undefined && failure === undefined;
            const content = (
              <>
                <MaterialCommunityIcons
                  name={alreadyImported ? 'check-circle' : failure ? 'cloud-alert-outline' : invalid ? 'alert-circle-outline' : isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={alreadyImported || isSelected ? theme.colors.primary : failure || invalid ? theme.colors.error : theme.colors.onSurfaceVariant}
                />
                <View style={styles.copy}>
                  <Text variant="titleSmall">{motorcycle.nickname.trim() || 'Motor tanpa nama'}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.currentOdometer.toLocaleString('id-ID')} km</Text>
                  <Text variant="bodySmall" style={{ color: failure || invalid ? theme.colors.error : theme.colors.onSurfaceVariant }}>
                    {alreadyImported ? 'Sudah disalin' : failure ? `Gagal · ${failure.reason}` : invalid ? invalid.reason : isSelected ? 'Dipilih' : 'Ketuk untuk memilih'}
                  </Text>
                </View>
                {failure ? <Button compact disabled={importing} onPress={() => openConfirmation([failure])} contentStyle={styles.button}>Coba lagi</Button> : null}
              </>
            );
            return selectable ? (
              <Pressable
                key={motorcycle.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: importing }}
                accessibilityLabel={`${motorcycle.nickname}, ${motorcycle.currentOdometer.toLocaleString('id-ID')} kilometer`}
                disabled={importing}
                onPress={() => setSelectedLocalIds((current) => current.includes(motorcycle.id) ? current.filter((id) => id !== motorcycle.id) : [...current, motorcycle.id])}
                style={({ pressed }) => [styles.localRow, { backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant, opacity: pressed ? 0.78 : 1 }]}
              >
                {content}
              </Pressable>
            ) : <View key={motorcycle.id} style={[styles.localRow, { backgroundColor: theme.colors.surfaceVariant }]}>{content}</View>;
          })}
        </View>

        <View style={styles.actions}>
          {plan.ready.length > 0 ? <Button mode="contained" icon="cloud-upload-outline" disabled={importing || !!loadFailure || !selected.length} loading={importing} onPress={() => openConfirmation(selected)} contentStyle={styles.button}>Tinjau {selected.length} motor</Button> : null}
          {!ledgerLoading && !motorcycles.length ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Garasi masih kosong. Tambahkan motor dari tab Garasi terlebih dahulu.</Text> : null}
          {!ledgerLoading && motorcycles.length > 0 && !plan.ready.length && !plan.invalid.length ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Semua motor lokal sudah tercatat untuk akun ini.</Text> : null}
        </View>
      </View>

      <SectionTitle description="Daftar terbaru dari akun setelah impor." action="Muat ulang" onAction={() => { void loadRemoteMotorcycles(); }}>Motor di akun</SectionTitle>
      <View style={surface}>
        {accountLoading ? <HelperText type="info" visible>Memuat daftar akun...</HelperText> : null}
        {accountFailure ? <HelperText type="error" visible accessibilityRole="alert">{accountFailure}</HelperText> : null}
        {!accountLoading && !accountFailure && !remoteMotorcycles.length ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Belum ada motor di akun {user.email}.</Text> : null}
        {remoteMotorcycles.map((motorcycle) => (
          <View key={motorcycle.id} style={styles.remoteRow}>
            <MaterialCommunityIcons name="motorbike" size={22} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.copy}>{motorcycle.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.odometerKm.toLocaleString('id-ID')} km</Text>
          </View>
        ))}
      </View>

      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => { if (!importing) setConfirmVisible(false); }} style={styles.dialog}>
          <Dialog.Title>Unggah {pending.length} motor ke akun?</Dialog.Title>
          <Dialog.Content>
            <Text variant="titleSmall">Tujuan: {user.email}</Text>
            <View style={styles.dialogItems}>
              {pending.map((item) => <View key={item.localId} style={styles.dialogItem}><Text variant="bodyMedium" style={styles.copy}>{item.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.odometerKm.toLocaleString('id-ID')} km</Text></View>)}
            </View>
            <Text variant="bodyMedium" style={styles.dialogCopy}>Hanya nama dan odometer saat ini yang disalin. Riwayat servis tetap di perangkat ini.</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button disabled={importing} onPress={() => setConfirmVisible(false)} contentStyle={styles.button}>Nanti</Button>
            <Button mode="contained" disabled={importing} onPress={() => { void upload(); }} contentStyle={styles.button}>Unggah sekarang</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  disclosure: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  icon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  detail: { marginTop: SPACING.xs },
  summary: { borderRadius: RADII.compact, padding: SPACING.lg, gap: SPACING.xs, marginTop: SPACING.xl },
  localList: { gap: SPACING.sm, marginTop: SPACING.xl },
  localRow: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADII.compact, padding: SPACING.md },
  actions: { gap: SPACING.md, marginTop: SPACING.xl },
  button: { minHeight: SPACING.touch },
  remoteRow: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dialog: { width: '90%', maxWidth: 520, alignSelf: 'center' },
  dialogItems: { gap: SPACING.sm, marginTop: SPACING.lg },
  dialogItem: { minHeight: SPACING.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dialogCopy: { marginTop: SPACING.md },
  dialogActions: { flexWrap: 'wrap' },
});
