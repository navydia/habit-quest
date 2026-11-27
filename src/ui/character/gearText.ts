import type { GearDef } from '@/src/content/gear';
import { STAT_KEYS } from '@/src/game/stats';
import { STAT_INFO } from './StatsCard';

export function statLine(def: GearDef): string {
  return STAT_KEYS.filter((k) => def.stats[k])
    .map((k) => `+${def.stats[k]} ${STAT_INFO[k].name}`)
    .join(' · ');
}
