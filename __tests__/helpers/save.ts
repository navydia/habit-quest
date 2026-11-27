import type { Habit, SaveData, Schedule } from '@/src/game/types';
import { newSave } from '@/src/save/migrate';

export function emptySave(): SaveData {
  return newSave();
}

export function habit(id: string, schedule: Schedule = { kind: 'daily' }): Habit {
  return { id, name: id, schedule, createdAt: '2026-01-01T00:00:00.000Z', archived: false, emoji: '✨', lifeArea: 'other', timeOfDay: 'anytime' };
}

export const at = (day: string, h: number, m = 0) => {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m);
};
