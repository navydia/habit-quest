import { addDays, dayKey, weekdayOf } from './dates';
import type { Completion, DayKey, Habit } from './types';

export function isScheduledOn(h: Habit, key: DayKey): boolean {
  if (h.archived) return false;
  if (h.schedule.kind === 'daily') return true;
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

export function uncomplete(c: Completion[], habitId: string, key: DayKey): Completion[] {
  return c.filter((x) => !(x.habitId === habitId && x.dayKey === key));
}

/** Habits can be logged for today, or yesterday ("I forgot to log it"). */
export function canLogDay(key: DayKey, now: Date): boolean {
  const today = dayKey(now);
  return key === today || key === addDays(today, -1);
}
