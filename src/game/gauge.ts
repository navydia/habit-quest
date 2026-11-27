import { GAUGE_FRACTION } from './config';
import { dayKey } from './dates';
import { isCompleted, scheduledHabits } from './habits';
import type { DayKey, SaveData } from './types';

export function gaugeTarget(scheduledCount: number): number {
  return Math.max(1, Math.ceil(GAUGE_FRACTION * scheduledCount));
}

export function gaugeProgress(
  s: SaveData,
  key: DayKey,
): { done: number; target: number; full: boolean; hasHabits: boolean } {
  const scheduled = scheduledHabits(s.habits, key);
  const done = scheduled.filter((h) => isCompleted(s.completions, h.id, key)).length;
  const target = gaugeTarget(scheduled.length);
  return { done, target, full: scheduled.length > 0 && done >= target, hasHabits: scheduled.length > 0 };
}

export function canStartQuest(s: SaveData, now: Date): boolean {
  const today = dayKey(now);
  return (
    gaugeProgress(s, today).full &&
    s.lastQuestStartedDayKey !== today &&
    s.activeRun === null &&
    s.pendingResult === null
  );
}
