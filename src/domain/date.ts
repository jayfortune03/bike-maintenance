import dayjs from 'dayjs';

export function isBeforeToday(value: string, today = new Date()): boolean {
  const date = dayjs(value);
  return date.isValid() && date.isBefore(dayjs(today), 'day');
}
