import { addDays, dayKey, weekdayOf } from './dates';
import type { Completion, DayKey, Habit } from './types';

function daysBetween(a: DayKey, b: DayKey): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

export function isScheduledOn(h: Habit, key: DayKey): boolean {
  if (h.archived) return false;
  if (key < dayKey(new Date(h.createdAt))) return false; // didn't exist yet
  if (h.schedule.kind === 'daily') return true;
  if (h.schedule.kind === 'interval') return daysBetween(dayKey(new Date(h.createdAt)), key) % Math.max(1, h.schedule.every) === 0;
  return h.schedule.days.includes(weekdayOf(key));
}

export function scheduledHabits(habits: Habit[], key: DayKey): Habit[] {
  return habits.filter((h) => isScheduledOn(h, key));
}

export function isCompleted(c: Completion[], habitId: string, key: DayKey): boolean {
  return c.some((x) => x.habitId === habitId && x.dayKey === key);
}

export function complete(c: Completion[], habitId: string, key: DayKey, now: Date): Completion[] {
  if (isCompleted(c, habitId, key)) return c;
  return [...c, { habitId, dayKey: key, at: now.toISOString() }];
}

/** Removes a completion from the History menu. It still counts as done. */
export function hideCompletion(c: Completion[], habitId: string, key: DayKey): Completion[] {
  return c.map((x) => (x.habitId === habitId && x.dayKey === key ? { ...x, hidden: true } : x));
}

export function uncomplete(c: Completion[], habitId: string, key: DayKey): Completion[] {
  return c.filter((x) => !(x.habitId === habitId && x.dayKey === key));
}

/** Habits can be logged for today, or yesterday ("I forgot to log it"). */
export function canLogDay(key: DayKey, now: Date): boolean {
  const today = dayKey(now);
  return key === today || key === addDays(today, -1);
}
