import { DAY_START_HOUR } from './config';
import type { DayKey, Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): DayKey {
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - DAY_START_HOUR, d.getMinutes());
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

function parse(key: DayKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m - 1, d];
}

export function weekdayOf(key: DayKey): Weekday {
  const [y, m, d] = parse(key);
  return new Date(y, m, d).getDay() as Weekday;
}

export function endOfDay(key: DayKey): Date {
  const [y, m, d] = parse(key);
  return new Date(y, m, d + 1, DAY_START_HOUR);
}

export function addDays(key: DayKey, days: number): DayKey {
  const [y, m, d] = parse(key);
  return dayKey(new Date(y, m, d + days, 12 + DAY_START_HOUR));
}
