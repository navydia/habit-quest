import type { Habit, SaveData, Schedule } from '@/src/game/types';

export function emptySave(): SaveData {
  return {
    version: 1,
    player: { level: 1, exp: 0, gold: 0, unspentSp: 0 },
    habits: [],
    completions: [],
    board: null,
    activeRun: null,
    pendingResult: null,
    lastQuestStartedDayKey: null,
    questLog: [],
  };
}

export function habit(id: string, schedule: Schedule = { kind: 'daily' }): Habit {
  return { id, name: id, schedule, createdAt: '2026-01-01T00:00:00.000Z', archived: false };
}

export const at = (day: string, h: number, m = 0) => {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m);
};
