import { useCallback, useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';
import type { RemoteMotorcycle, SharedInvitation } from '@/src/auth/contracts';
import { ApiClientError, SessionExpiredError, StaleSessionError } from '@/src/auth/errors';
import { accountApi, authSession } from '@/src/auth/runtime';
import { SectionTitle } from '@/src/components/SectionTitle';
import { currentMembershipRole } from '@/src/domain/shared-motorcycle';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

function roleLabel(motorcycle: RemoteMotorcycle): string {
  const role = currentMembershipRole(motorcycle);
  switch (role) {
    case 'OWNER': return 'Pemilik';
    case 'EDITOR': return 'Editor';
    case 'VIEWER': return 'Pembaca';
    case undefined: return 'Anggota';
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

function loadMessage(error: ApiClientError | z.ZodError): string {
  if (error instanceof z.ZodError) return 'Data garasi bersama dari server tidak dapat dibaca.';
  if (error.kind === 'network') return 'Garasi bersama belum dapat dijangkau. Garasi lokal tetap tersedia.';
  return 'Garasi bersama belum dapat dimuat.';
}

export function SharedGaragePanel({ userId }: { readonly userId: string }) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const theme = useTheme();
  const request = useRef(0);
  const [motorcycles, setMotorcycles] = useState<readonly RemoteMotorcycle[]>([]);
  const [invitations, setInvitations] = useState<readonly SharedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string>();
  const [message, setMessage] = useState('');
  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];

  const refresh = useCallback(async () => {
    const currentRequest = ++request.current;
    setLoading(true);
    setMessage('');
    try {
      const [nextMotorcycles, nextInvitations] = await Promise.all([
        accountApi.listMotorcycles(),
        accountApi.listInvitations(),
      ]);
      if (currentRequest !== request.current || authSession.accountId !== userId) return;
      setMotorcycles(nextMotorcycles);
      setInvitations(nextInvitations);
    } catch (error) {
      if (currentRequest !== request.current || authSession.accountId !== userId || error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setMessage(loadMessage(error));
      else throw error;
    } finally {
      if (currentRequest === request.current && authSession.accountId === userId) setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { ++request.current; };
  }, [refresh]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isFocused) void refresh();
    });
    return () => subscription.remove();
  }, [isFocused, refresh]);

  const accept = async (invitation: SharedInvitation) => {
    if (acceptingId) return;
    setAcceptingId(invitation.id);
    setMessage('');
    try {
      await accountApi.acceptInvitation(invitation.id);
      if (authSession.accountId !== userId) return;
      await refresh();
      if (authSession.accountId === userId) setMessage(`Undangan untuk ${invitation.motorcycleName} diterima.`);
    } catch (error) {
      if (error instanceof StaleSessionError || error instanceof SessionExpiredError) return;
      if (error instanceof ApiClientError || error instanceof z.ZodError) setMessage('Undangan belum dapat diterima. Coba lagi.');
      else throw error;
    } finally {
      if (authSession.accountId === userId) setAcceptingId(undefined);
    }
  };

  return (
    <>
      <SectionTitle description="Undangan hanya menambahkan akses akun ini; Garasi lokal tidak berubah.">Undangan bersama</SectionTitle>
      <View style={surface}>
        {loading ? <HelperText type="info" visible>Memuat undangan...</HelperText> : null}
        {!loading && !invitations.length ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Tidak ada undangan yang menunggu.</Text> : null}
        <View style={styles.list}>
          {invitations.map((invitation) => (
            <View key={invitation.id} style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name="account-multiple-plus-outline" size={22} color={theme.colors.onPrimaryContainer} />
              </View>
              <View style={styles.copy}>
                <Text variant="titleSmall">{invitation.motorcycleName}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Seseorang mengundang Anda ke garasi bersama.</Text>
              </View>
              <Button loading={acceptingId === invitation.id} disabled={acceptingId !== undefined} onPress={() => { void accept(invitation); }} contentStyle={styles.button}>Terima</Button>
            </View>
          ))}
        </View>
        {message ? <HelperText type={message.includes('diterima') ? 'info' : 'error'} visible accessibilityRole="alert" accessibilityLiveRegion="polite">{message}</HelperText> : null}
      </View>

      <SectionTitle description="Data ini berasal dari akun dan tidak disalin ke Garasi lokal." action="Muat ulang" onAction={() => { void refresh(); }}>Garasi bersama</SectionTitle>
      <View style={surface}>
        {loading ? <HelperText type="info" visible>Memuat motor bersama...</HelperText> : null}
        {!loading && !message && !motorcycles.length ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Belum ada motor bersama di akun ini.</Text> : null}
        <View style={styles.list}>
          {motorcycles.map((motorcycle) => (
            <Pressable
              key={motorcycle.id}
              accessibilityRole="button"
              accessibilityLabel={`${motorcycle.name}, ${motorcycle.odometerKm.toLocaleString('id-ID')} kilometer, peran ${roleLabel(motorcycle)}`}
              accessibilityHint="Buka riwayat kondisi motor"
              onPress={() => router.push({ pathname: '/shared/[id]', params: { id: motorcycle.id } })}
              style={({ pressed }) => [styles.motorcycle, { backgroundColor: theme.colors.surfaceVariant, opacity: pressed ? 0.78 : 1 }]}
            >
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name="motorbike" size={24} color={theme.colors.onPrimaryContainer} />
              </View>
              <View style={styles.copy}>
                <Text variant="titleMedium">{motorcycle.name}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{motorcycle.odometerKm.toLocaleString('id-ID')} km · {roleLabel(motorcycle)}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  list: { gap: SPACING.sm },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADII.compact, padding: SPACING.md },
  motorcycle: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADII.compact, padding: SPACING.md },
  icon: { width: SPACING.touch, height: SPACING.touch, borderRadius: RADII.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: SPACING.xs },
  button: { minHeight: SPACING.touch },
});
