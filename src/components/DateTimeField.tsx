import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text, TextInput, useTheme } from 'react-native-paper';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDisplayDate(value: string): string {
  return parseDate(value).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const date = parseDate(value);
  const updateFromNative = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type !== 'dismissed' && nextDate) onChange(formatLocalDateTime(nextDate));
  };

  if (Platform.OS === 'web') return <View style={styles.webField}><TextInput label={label} mode="outlined" value={formatDisplayDate(value)} editable={false} right={<TextInput.Icon icon="calendar-clock-outline" />} /><input ref={inputRef} aria-label={label} type="datetime-local" value={value} onChange={(event) => onChange(event.currentTarget.value)} style={styles.webPicker} /></View>;

  return <><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)}><TextInput label={label} mode="outlined" value={formatDisplayDate(value)} editable={false} onPressIn={() => setOpen(true)} right={<TextInput.Icon icon="calendar-clock-outline" onPress={() => setOpen(true)} />} /></Pressable>{open ? <DateTimePicker value={date} mode="datetime" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={updateFromNative} /> : null}</>;
}

const styles = StyleSheet.create({ webField: { position: 'relative' }, webPicker: { position: 'absolute', left: 0, top: 0, width: '100%', height: 56, opacity: 0, zIndex: 2 } });
