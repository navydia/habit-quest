import { familiarById } from '../content/regions';
import type { SaveData } from './types';

/** Multipliers from the active familiar, applied when a result is collected. */
export function familiarBonus(s: SaveData): { exp: number; gold: number } {
  const f = s.familiars.active ? familiarById(s.familiars.active) : undefined;
  if (!f || !s.familiars.owned.includes(f.id)) return { exp: 1, gold: 1 };
  const m = 1 + f.bonus.pct / 100;
  return f.bonus.kind === 'exp' ? { exp: m, gold: 1 } : { exp: 1, gold: m };
}
