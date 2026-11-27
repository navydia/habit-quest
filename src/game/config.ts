// All game tuning lives here.
export const DAY_START_HOUR = 0;
export const GAUGE_FRACTION = 0.6;
export const QUEST_BASE_MS = 8 * 3600_000;
export const QUEST_CUT_MS = 20 * 60_000;
export const QUEST_FLOOR_MS = 5 * 3600_000;
export const FAIL_REWARD_FRACTION = 0.25;
export const SP_PER_LEVEL = 3;

/** Success chance by how far power falls short of the required power. */
export const SUCCESS_BANDS = {
  meets: 1, // power >= required
  closeShortfall: 50, // short by up to this many points...
  close: 0.6, // ...gives this chance
  far: 0.2, // anything further short
};

// Stats (Plan 2)
export const POWER_PER_POINT = 3;
export const SPEED_CUT_PER_POINT = 0.015;
export const SPEED_CUT_MAX = 0.2;

// Drops (Plan 2)
export const DROP_CHANCE = { easy: 0.15, normal: 0.25, hard: 0.45 } as const;
export const DROP_LUCK_PER_POINT = 0.01;
/** Rarity weights; each Luck point moves RARITY_LUCK_SHIFT from common to rare. */
export const RARITY_WEIGHTS = { common: 60, uncommon: 28, rare: 9, epic: 2.5, legendary: 0.5 } as const;
export const RARITY_LUCK_SHIFT = 0.5;
