// All game tuning lives here.
export const DAY_START_HOUR = 0;
export const GAUGE_FRACTION = 0.6;
export const QUEST_BASE_MS = 8 * 3600_000;
export const QUEST_CUT_MS = 20 * 60_000;
export const QUEST_FLOOR_MS = 5 * 3600_000;
export const FAIL_REWARD_FRACTION = 0.25;
export const BOARD_SIZE = 3;
export const SP_PER_LEVEL = 3;

/** Success chance by how far power falls short of the required power. */
export const SUCCESS_BANDS = {
  meets: 1, // power >= required
  closeShortfall: 50, // short by up to this many points...
  close: 0.6, // ...gives this chance
  far: 0.05, // anything further short
};
