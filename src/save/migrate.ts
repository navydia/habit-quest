import { classTitle } from '../game/classTitle';
import { zeroStats } from '../game/stats';
import type { Player, SaveData } from '../game/types';

export const CURRENT_VERSION = 3;

const START_REGION = 'thornwick-meadows';
const worldDefaults = () => ({
  world: { currentRegion: START_REGION, regions: {} },
  boss: { habitId: null, tokenEpoch: null },
  familiars: { owned: [] as string[], active: null },
});

const STARTING_GEAR = [
  { uid: 'start-weapon', gearId: 'wooden-sword', obtainedAt: '2026-01-01T00:00:00.000Z' },
  { uid: 'start-body', gearId: 'travellers-tunic', obtainedAt: '2026-01-01T00:00:00.000Z' },
];

/** Adds the Plan 2 character fields to a v1 player. */
function withCharacter(p: { level: number; exp: number; gold: number; unspentSp: number }): Player {
  const player: Player = {
    ...p,
    spentSp: 0,
    stats: zeroStats(),
    inventory: STARTING_GEAR.map((i) => ({ ...i })),
    equipped: { weapon: 'start-weapon', body: 'start-body' },
    title: 'Wanderer',
  };
  return { ...player, title: classTitle(player) };
}

export function newSave(): SaveData {
  return {
    version: 3,
    ...worldDefaults(),
    player: withCharacter({ level: 1, exp: 0, gold: 0, unspentSp: 0 }),
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
const MIGRATIONS: Record<number, (s: any) => any> = {
  2: (s) => ({ ...s, ...worldDefaults(), version: 3, board: null }),
  1: (s) => (typeof s.player?.level === 'number' ? { ...s, version: 2, player: withCharacter(s.player) } : { ...s, version: 2 }),
};

function isValidCurrent(s: any): s is SaveData {
  return (
    s?.version === CURRENT_VERSION &&
    typeof s.player?.level === 'number' &&
    Array.isArray(s.player?.inventory) &&
    typeof s.player?.stats === 'object' &&
    typeof s.player?.equipped === 'object' &&
    typeof s.world?.currentRegion === 'string' &&
    typeof s.world?.regions === 'object' &&
    Array.isArray(s.familiars?.owned) &&
    typeof s.boss === 'object' &&
    s.boss !== null &&
    s.player?.equipped !== null &&
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
