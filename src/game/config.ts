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

// Bosses (Plan 3)
export const BOSS_TOKENS_NEEDED = 6;
export const BOSS_DEFENSE_PER_POINT = 2;
export const BOSS_BASE = { exp: 150, gold: 80 };
export const BOSS_DIFFICULTY = {
  // extraPower: added to the boss's required power. belowChance: odds when your power falls short.
  normal: { extraPower: 0, belowChance: 1, reward: 1, familiar: 1, rarityShift: 0 },
  hard: { extraPower: 30, belowChance: 0.5, reward: 1.75, familiar: 2, rarityShift: 10 },
  extreme: { extraPower: 60, belowChance: 0.05, reward: 3, familiar: 4, rarityShift: 20 },
} as const;
/** Boss loot never includes commons. rarityShift moves weight from uncommon to epic/legendary (2:1). */
export const BOSS_RARITY_WEIGHTS = { uncommon: 50, rare: 35, epic: 12, legendary: 3 } as const;
export const FAMILIAR_BASE_CHANCE = 0.1;
export const FAMILIAR_LUCK_PER_POINT = 0.005;
