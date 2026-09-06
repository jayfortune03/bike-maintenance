import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button, Text, useTheme } from 'react-native-paper';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimeField({ label, value, onChange, disabled = false, error = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | 'datetime' | null>(null);
  const parsed = new Date(value);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const updateFromNative = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') setMode(null);
    if (event.type === 'set' && nextDate) onChange(formatLocalDateTime(nextDate));
  };

  return (
    <View style={styles.field}>
      <Text variant="labelLarge" style={{ color: error ? theme.colors.error : theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {Platform.OS === 'web' ? (
        <input
          aria-label={label}
          aria-invalid={error}
          type="datetime-local"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          style={{
            boxSizing: 'border-box', width: '100%', minWidth: 0, minHeight: 56,
            padding: 16, borderRadius: 12,
            fontFamily: theme.fonts.bodyLarge.fontFamily,
            fontSize: theme.fonts.bodyLarge.fontSize,
            fontWeight: theme.fonts.bodyLarge.fontWeight,
            letterSpacing: theme.fonts.bodyLarge.letterSpacing,
            border: `1px solid ${error ? theme.colors.error : theme.colors.outline}`,
            backgroundColor: theme.colors.surface, color: theme.colors.onSurface,
            colorScheme: theme.dark ? 'dark' : 'light',
          }}
        />
      ) : (
        <>
          <View style={styles.controls}>
            <Button
              mode="outlined"
              icon="calendar-outline"
              disabled={disabled}
              style={styles.option}
              contentStyle={styles.button}
              onPress={() => setMode(Platform.OS === 'ios' ? 'datetime' : 'date')}
              accessibilityLabel={`Pilih tanggal: ${date.toLocaleDateString('id-ID')}`}
            >
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Button>
            <Button
              mode="outlined"
              icon="clock-outline"
              disabled={disabled}
              style={styles.option}
              contentStyle={styles.button}
              onPress={() => setMode(Platform.OS === 'ios' ? 'datetime' : 'time')}
              accessibilityLabel={`Pilih waktu: ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
            >
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </Button>
          </View>
          {mode && !disabled ? (
            <View>
              <DateTimePicker
                value={date}
                mode={mode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={updateFromNative}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
              {Platform.OS === 'ios' ? (
                <Button onPress={() => setMode(null)} contentStyle={styles.button}>Selesai memilih</Button>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  option: { flexGrow: 1, flexBasis: 160, borderRadius: 12 },
  button: { minHeight: 48 },
});
