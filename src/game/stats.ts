import { gearById } from '../content/gear';
import { POWER_PER_POINT, SPEED_CUT_MAX, SPEED_CUT_PER_POINT } from './config';
import type { Player, StatKey, Stats } from './types';

export const STAT_KEYS: StatKey[] = ['power', 'defense', 'luck', 'speed'];
export const zeroStats = (): Stats => ({ power: 0, defense: 0, luck: 0, speed: 0 });

export function allocateSp(p: Player, stat: StatKey): Player {
  if (p.unspentSp <= 0) return p;
  return { ...p, unspentSp: p.unspentSp - 1, spentSp: p.spentSp + 1, stats: { ...p.stats, [stat]: p.stats[stat] + 1 } };
}

/** Free respec: every spent point comes back. */
export function respec(p: Player): Player {
  return { ...p, stats: zeroStats(), unspentSp: p.unspentSp + p.spentSp, spentSp: 0 };
}

export function equippedDefs(p: Player) {
  return Object.values(p.equipped)
    .map((uid) => p.inventory.find((i) => i.uid === uid))
    .map((item) => (item ? gearById(item.gearId) : undefined))
    .filter((d) => d !== undefined);
}

export function gearStats(p: Player): Stats {
  const s = zeroStats();
  for (const d of equippedDefs(p)) for (const k of STAT_KEYS) s[k] += d.stats[k] ?? 0;
  return s;
}

export function totalStats(p: Player): Stats {
  const g = gearStats(p);
  return { power: p.stats.power + g.power, defense: p.stats.defense + g.defense, luck: p.stats.luck + g.luck, speed: p.stats.speed + g.speed };
}

export function basePower(level: number): number {
  return 100 + 15 * (level - 1);
}

export function powerOf(p: Player): number {
  return basePower(p.level) + POWER_PER_POINT * totalStats(p).power;
}

/** Multiplier on quest duration from Speed. */
export function speedFactor(p: Player): number {
  return 1 - Math.min(SPEED_CUT_MAX, SPEED_CUT_PER_POINT * totalStats(p).speed);
}
