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

export function DateTimeField({ label, value, onChange, disabled = false, error = false, dateOnly = false, optional = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  dateOnly?: boolean;
  optional?: boolean;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | 'datetime' | null>(null);
  const parsed = new Date(value);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const updateFromNative = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') setMode(null);
    if (event.type === 'set' && nextDate) {
      const selected = new Date(nextDate);
      if (dateOnly) selected.setHours(0, 0, 0, 0);
      onChange(formatLocalDateTime(selected));
    }
  };
  const dateValue = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  return (
    <View style={styles.field}>
      <Text variant="labelLarge" style={{ color: error ? theme.colors.error : theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {Platform.OS === 'web' ? (
        <input
          aria-label={label}
          aria-invalid={error}
          type={dateOnly ? 'date' : 'datetime-local'}
          value={dateOnly ? (value ? dateValue : '') : value}
          disabled={disabled}
          onChange={(event) => {
            const selected = event.currentTarget.value;
            onChange(dateOnly ? (selected ? `${selected}T00:00` : '') : selected);
          }}
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
          {dateOnly ? (
            <View style={styles.controls}>
              <Button
                mode="outlined"
                icon="calendar-outline"
                disabled={disabled}
                style={styles.option}
                contentStyle={styles.button}
                onPress={() => setMode('date')}
                accessibilityLabel={value ? `Pilih tanggal: ${date.toLocaleDateString('id-ID')}` : `Pilih ${label.toLowerCase()}`}
              >
                {value ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih tanggal'}
              </Button>
              {optional && value ? <Button mode="text" icon="close" disabled={disabled} contentStyle={styles.button} onPress={() => { setMode(null); onChange(''); }}>Hapus</Button> : null}
            </View>
          ) : (
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
          )}
          {mode && !disabled ? (
            <View>
              <DateTimePicker
                value={date}
                mode={dateOnly ? 'date' : mode}
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
