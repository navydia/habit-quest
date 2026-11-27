import type { SaveData } from '../game/types';

export const CURRENT_VERSION = 1;

export function newSave(): SaveData {
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

/** MIGRATIONS[n] upgrades a version-n save to version n+1. */
const MIGRATIONS: Record<number, (s: any) => any> = {};

function isValidCurrent(s: any): s is SaveData {
  return (
    s?.version === CURRENT_VERSION &&
    typeof s.player?.level === 'number' &&
    Array.isArray(s.habits) &&
    Array.isArray(s.completions) &&
    Array.isArray(s.questLog)
  );
}

export function migrate(raw: unknown): { save: SaveData; recovered: boolean } {
  if (raw === null || raw === undefined) return { save: newSave(), recovered: false };
  let s: any = raw;
  if (typeof s !== 'object' || Array.isArray(s) || typeof s.version !== 'number') {
    return { save: newSave(), recovered: true };
  }
  while (s.version < CURRENT_VERSION && MIGRATIONS[s.version]) s = MIGRATIONS[s.version](s);
  return isValidCurrent(s) ? { save: s, recovered: false } : { save: newSave(), recovered: true };
}
