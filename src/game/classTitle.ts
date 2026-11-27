import { CLASS_TITLES, NO_WEAPON_TITLE } from '../content/classes';
import { gearById } from '../content/gear';
import { STAT_KEYS, totalStats } from './stats';
import type { Player } from './types';

export function classTitle(p: Player): string {
  const uid = p.equipped.weapon;
  const weapon = uid ? gearById(p.inventory.find((i) => i.uid === uid)?.gearId ?? '') : undefined;
  if (!weapon?.weaponType) return NO_WEAPON_TITLE;
  const titles = CLASS_TITLES[weapon.weaponType];
  const t = totalStats(p);
  const top = Math.max(...STAT_KEYS.map((k) => t[k]));
  const tied = STAT_KEYS.filter((k) => t[k] === top);
  const current = tied.find((k) => titles[k] === p.title);
  return titles[current ?? tied[0]];
}
