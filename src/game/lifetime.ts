import type { SaveData } from './types';

export interface LifetimeStats {
  adventuresCompleted: number;
  adventuresTried: number;
  habitsCompleted: number;
  bossesBeaten: number;
  regionsExplored: number;
  mementos: number;
  goldEarned: number;
}

/** Derived from the save, so nothing extra has to be tracked. */
export function lifetimeStats(s: SaveData): LifetimeStats {
  const adventures = s.questLog.filter((r) => r.kind !== 'boss');
  const regions = Object.values(s.world.regions);
  return {
    adventuresCompleted: adventures.filter((r) => r.success).length,
    adventuresTried: adventures.length,
    habitsCompleted: s.completions.length,
    bossesBeaten: s.questLog.filter((r) => r.boss?.success).length,
    regionsExplored: new Set([...Object.keys(s.world.regions), s.world.currentRegion]).size,
    mementos: regions.reduce((n, r) => n + r.mementos.length, 0),
    goldEarned: s.questLog.reduce((n, r) => n + r.gold + (r.boss?.gold ?? 0), 0),
  };
}
