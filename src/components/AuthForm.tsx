import { useState } from 'react';
import * as z from 'zod';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { authCredentialsSchema, type AuthMode } from '@/src/auth/contracts';
import { ApiClientError, SessionStorageError, StaleSessionError } from '@/src/auth/errors';
import { authSession } from '@/src/auth/runtime';
import { CARD_SHADOW, RADII, SPACING } from '@/src/theme/theme';

function errorMessage(error: ApiClientError | SessionStorageError | StaleSessionError | z.ZodError, mode: AuthMode): string {
  if (error instanceof SessionStorageError) return 'Penyimpanan sesi aman tidak tersedia di perangkat ini.';
  if (error instanceof StaleSessionError) return 'Permintaan sebelumnya dibatalkan karena sesi berubah.';
  if (error instanceof z.ZodError) return 'Respons server tidak dapat dibaca. Coba lagi nanti.';
  if (error.kind === 'configuration') return 'Alamat API belum dikonfigurasi untuk aplikasi ini.';
  if (error.kind === 'network') return 'API tidak dapat dihubungi. Periksa koneksi lalu coba lagi.';
  if (error.status === 401) return 'Email atau kata sandi tidak cocok.';
  if (error.status === 409 && mode === 'register') return 'Email ini sudah terdaftar. Pilih Masuk.';
  if (error.status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  return 'Akun belum dapat diproses. Periksa data lalu coba lagi.';
}

export function AuthForm({ notice }: { readonly notice?: string }) {
  const theme = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const credentials = authCredentialsSchema.safeParse({ email, password });
  const confirmationInvalid = mode === 'register' && confirmation !== password;

  const changeMode = (value: string) => {
    if (value !== 'login' && value !== 'register') return;
    setMode(value);
    setPassword('');
    setConfirmation('');
    setSubmitted(false);
    setError('');
  };

  const submit = async () => {
    setSubmitted(true);
    setError('');
    if (!credentials.success || confirmationInvalid || submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'login') await authSession.login(credentials.data);
      else await authSession.register(credentials.data);
    } catch (caught) {
      if (caught instanceof ApiClientError || caught instanceof SessionStorageError || caught instanceof StaleSessionError || caught instanceof z.ZodError) {
        setError(errorMessage(caught, mode));
      } else {
        throw caught;
      }
    } finally {
      if (authSession.getSnapshot().status !== 'signed-in') setSubmitting(false);
    }
  };

  const surface = [styles.surface, CARD_SHADOW, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }];
  return (
    <View style={surface}>
      <Text accessibilityRole="header" variant="titleLarge">Masuk ke akun Motor Care</Text>
      <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>Buka garasi bersama atau salin motor yang Anda pilih. Garasi lokal tetap dapat dipakai tanpa akun.</Text>
      {notice ? <HelperText type="info" visible accessibilityLiveRegion="polite">{notice}</HelperText> : null}

      <SegmentedButtons
        value={mode}
        onValueChange={changeMode}
        buttons={[
          { value: 'login', label: 'Masuk', icon: 'login' },
          { value: 'register', label: 'Daftar', icon: 'account-plus-outline' },
        ]}
        style={styles.mode}
      />

      <View style={styles.fields}>
        <View>
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={submitted && !credentials.success}
          />
          {submitted && !credentials.success ? <HelperText type="error">Masukkan email valid dan kata sandi 12-128 karakter.</HelperText> : null}
        </View>
        <TextInput
          label="Kata sandi"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          textContentType={mode === 'login' ? 'password' : 'newPassword'}
          error={submitted && !credentials.success}
        />
        {mode === 'register' ? (
          <View>
            <TextInput
              label="Ulangi kata sandi"
              mode="outlined"
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              error={submitted && confirmationInvalid}
              onSubmitEditing={() => { void submit(); }}
            />
            {submitted && confirmationInvalid ? <HelperText type="error">Kata sandi belum sama.</HelperText> : null}
          </View>
        ) : null}
      </View>

      {error ? <HelperText type="error" visible accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</HelperText> : null}
      <Button mode="contained" icon={mode === 'login' ? 'login' : 'account-plus-outline'} loading={submitting} disabled={submitting} onPress={submit} contentStyle={styles.button}>
        {mode === 'login' ? 'Masuk ke akun' : 'Buat akun'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: RADII.card, padding: SPACING.xl },
  description: { marginTop: SPACING.sm },
  mode: { marginTop: SPACING.xxl },
  fields: { gap: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.md },
  button: { minHeight: SPACING.touch },
});
