import { QUEST_TEMPLATES } from '../content/quests';
import { REGIONS, regionById } from '../content/regions';
import { SUCCESS_BANDS } from './config';
import type { DayKey, Difficulty, Player, QuestOffer } from './types';

export const DIFFICULTY: Record<Difficulty, { rewardMult: number }> = {
  easy: { rewardMult: 1 },
  normal: { rewardMult: 1.6 },
  hard: { rewardMult: 3 },
};

export function successChance(power: number, required: number): number {
  if (power >= required) return SUCCESS_BANDS.meets;
  if (required - power <= SUCCESS_BANDS.closeShortfall) return SUCCESS_BANDS.close;
  return SUCCESS_BANDS.far;
}

/** The region's three fixed adventures. Required power is fixed, so odds improve as you grow. */
export function generateBoard(key: DayKey, _player: Player, _rng: () => number, regionId: string = REGIONS[0].id): QuestOffer[] {
  const region = regionById(regionId) ?? REGIONS[0];
  return region.adventures.map((a) => {
    const template = QUEST_TEMPLATES.find((t) => t.id === a.id);
    const mult = DIFFICULTY[a.difficulty].rewardMult * region.rewardScale;
    return {
      id: `${key}-${a.difficulty}`,
      templateId: a.id,
      name: template?.name ?? a.id,
      flavour: template?.flavour ?? '',
      difficulty: a.difficulty,
      requiredPower: a.requiredPower,
      rewardExp: Math.round(40 * mult),
      rewardGold: Math.round(20 * mult),
      regionId: region.id,
    };
  });
}
