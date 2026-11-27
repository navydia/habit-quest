import { QUEST_TEMPLATES } from '../content/quests';
import { BOARD_SIZE, SUCCESS_BANDS } from './config';
import { powerOf } from './stats';
import type { DayKey, Difficulty, Player, QuestOffer } from './types';

export const DIFFICULTY: Record<Difficulty, { offsetMin: number; offsetMax: number; rewardMult: number }> = {
  easy: { offsetMin: -60, offsetMax: 0, rewardMult: 1 },
  normal: { offsetMin: 10, offsetMax: 50, rewardMult: 1.6 },
  hard: { offsetMin: 35, offsetMax: 90, rewardMult: 3 },
};

const ORDER: Difficulty[] = ['easy', 'normal', 'hard'];

export function successChance(power: number, required: number): number {
  if (power >= required) return SUCCESS_BANDS.meets;
  if (required - power <= SUCCESS_BANDS.closeShortfall) return SUCCESS_BANDS.close;
  return SUCCESS_BANDS.far;
}

const intBetween = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

export function generateBoard(key: DayKey, player: Player, rng: () => number): QuestOffer[] {
  const pool = [...QUEST_TEMPLATES];
  const levelMult = 1 + 0.1 * (player.level - 1);
  return ORDER.slice(0, BOARD_SIZE).map((difficulty) => {
    const template = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const d = DIFFICULTY[difficulty];
    return {
      id: `${key}-${difficulty}`,
      templateId: template.id,
      name: template.name,
      flavour: template.flavour,
      difficulty,
      requiredPower: powerOf(player) + intBetween(rng, d.offsetMin, d.offsetMax),
      rewardExp: Math.round(40 * d.rewardMult * levelMult),
      rewardGold: Math.round(20 * d.rewardMult * levelMult),
    };
  });
}
