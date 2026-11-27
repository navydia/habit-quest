import { GEAR, RARITY_ORDER, type GearDef } from '../content/gear';
import { DROP_CHANCE, DROP_LUCK_PER_POINT, RARITY_LUCK_SHIFT, RARITY_WEIGHTS } from './config';
import { totalStats } from './stats';
import type { Difficulty, Player, Rarity } from './types';

export function dropChance(difficulty: Difficulty, p: Player): number {
  return Math.min(1, DROP_CHANCE[difficulty] + DROP_LUCK_PER_POINT * totalStats(p).luck);
}

function rarityWeights(p: Player): Record<Rarity, number> {
  const shift = Math.min(RARITY_WEIGHTS.common - 1, RARITY_LUCK_SHIFT * totalStats(p).luck);
  return { ...RARITY_WEIGHTS, common: RARITY_WEIGHTS.common - shift, rare: RARITY_WEIGHTS.rare + shift };
}

/** Three rolls: does it drop, which rarity, which item of that rarity. */
export function rollDrop(difficulty: Difficulty, p: Player, rng: () => number): GearDef | null {
  if (rng() >= dropChance(difficulty, p)) return null;
  const weights = rarityWeights(p);
  const total = RARITY_ORDER.reduce((a, r) => a + weights[r], 0);
  let roll = rng() * total;
  let rarity: Rarity = 'common';
  for (const r of RARITY_ORDER) {
    rarity = r;
    roll -= weights[r];
    if (roll < 0) break;
  }
  const pool = GEAR.filter((g) => g.rarity === rarity);
  return pool[Math.floor(rng() * pool.length)] ?? null;
}
