import { SP_PER_LEVEL } from './config';
import type { Player } from './types';

export function expToNext(level: number): number {
  return 100 * level;
}


export function addExp(p: Player, exp: number): { player: Player; levelsGained: number } {
  let { level, exp: current, unspentSp } = p;
  current += exp;
  let levelsGained = 0;
  while (current >= expToNext(level)) {
    current -= expToNext(level);
    level += 1;
    unspentSp += SP_PER_LEVEL;
    levelsGained += 1;
  }
  return { player: { ...p, level, exp: current, unspentSp }, levelsGained };
}
