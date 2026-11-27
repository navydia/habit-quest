import { GEAR, type GearDef } from '../content/gear';
import { REGIONS, bossById, regionOfBoss, type BossDef } from '../content/regions';
import { BOSS_BASE, BOSS_DEFENSE_PER_POINT, BOSS_DIFFICULTY, BOSS_RARITY_WEIGHTS, BOSS_TOKENS_NEEDED, FAMILIAR_BASE_CHANCE, FAMILIAR_LUCK_PER_POINT } from './config';
import { powerOf, totalStats } from './stats';
import type { BossDifficulty, Player, QuestResult, QuestRun, Rarity, SaveData } from './types';
import { isRegionUnlocked } from './world';

const keyOf = (c: { habitId: string; dayKey: string }) => `${c.habitId}|${c.dayKey}`;

/** Boss-habit completions after the epoch that haven't been spent, plus any given-back tokens. Max 6. */
export function bossTokens(s: SaveData): number {
  const { habitId, tokenEpoch, spentKeys = [], bonusTokens = 0 } = s.boss;
  if (!habitId || s.habits.find((h) => h.id === habitId)?.archived) return 0;
  const spent = new Set(spentKeys);
  const n = s.completions.filter((c) => c.habitId === habitId && (!tokenEpoch || c.at > tokenEpoch) && !spent.has(keyOf(c))).length;
  return Math.min(BOSS_TOKENS_NEEDED, n + bonusTokens);
}

export function setBossHabit(s: SaveData, habitId: string, now: Date): SaveData {
  return { ...s, boss: { habitId, tokenEpoch: now.toISOString(), spentKeys: [], bonusTokens: 0 } };
}

export function availableBosses(s: SaveData): BossDef[] {
  return REGIONS.filter((r) => isRegionUnlocked(s, r.id)).map((r) => r.boss);
}

export function bossRequiredPower(boss: BossDef, difficulty: BossDifficulty): number {
  return boss.requiredPower + BOSS_DIFFICULTY[difficulty].extraPower;
}

/** Normal always wins. Hard and Extreme win if your power (plus Defense) meets their requirement, otherwise 50% / 5%. */
export function bossChance(p: Player, boss: BossDef, difficulty: BossDifficulty): number {
  const effective = powerOf(p) + BOSS_DEFENSE_PER_POINT * totalStats(p).defense;
  return effective >= bossRequiredPower(boss, difficulty) ? 1 : BOSS_DIFFICULTY[difficulty].belowChance;
}

/** Validates and builds the boss part of a run, spending the tokens. */
export function attachBoss(s: SaveData, boss: { bossId: string; difficulty: BossDifficulty }, now: Date): { save: SaveData; runBoss: NonNullable<QuestRun['boss']> } {
  if (bossTokens(s) < BOSS_TOKENS_NEEDED) throw new Error('Not enough boss tokens.');
  const def = availableBosses(s).find((b) => b.id === boss.bossId);
  if (!def) throw new Error(`Boss not available: ${boss.bossId}`);
  return {
    save: {
      ...s,
      boss: {
        ...s.boss,
        tokenEpoch: now.toISOString(),
        // Every completion of the boss habit so far is spent: re-checking those days earns nothing.
        spentKeys: s.completions.filter((c) => c.habitId === s.boss.habitId).map(keyOf),
        bonusTokens: 0,
      },
    },
    runBoss: {
      bossId: def.id,
      difficulty: boss.difficulty,
      successChance: bossChance(s.player, def, boss.difficulty),
      prevEpoch: s.boss.tokenEpoch,
      prevSpentKeys: s.boss.spentKeys ?? [],
      prevBonus: s.boss.bonusTokens ?? 0,
    },
  };
}

function rollBossDrop(difficulty: BossDifficulty, rng: () => number): GearDef | undefined {
  const shift = BOSS_DIFFICULTY[difficulty].rarityShift;
  const w: Partial<Record<Rarity, number>> = {
    uncommon: BOSS_RARITY_WEIGHTS.uncommon - shift,
    rare: BOSS_RARITY_WEIGHTS.rare,
    epic: BOSS_RARITY_WEIGHTS.epic + (shift * 2) / 3,
    legendary: BOSS_RARITY_WEIGHTS.legendary + shift / 3,
  };
  const order: Rarity[] = ['uncommon', 'rare', 'epic', 'legendary'];
  let roll = rng() * order.reduce((a, r) => a + (w[r] ?? 0), 0);
  let rarity: Rarity = 'uncommon';
  for (const r of order) {
    rarity = r;
    roll -= w[r] ?? 0;
    if (roll < 0) break;
  }
  const pool = GEAR.filter((g) => g.rarity === rarity);
  return pool[Math.floor(rng() * pool.length)];
}

/** Rolls the boss at return time. Win: rewards, loot, maybe a familiar, region boss beaten. Loss: tokens come back. */
export function resolveBoss(s: SaveData, run: QuestRun, rng: () => number): { save: SaveData; result?: QuestResult['boss'] } {
  const b = run.boss;
  const def = b ? bossById(b.bossId) : undefined;
  if (!b || !def) return { save: s };
  const success = rng() < b.successChance;
  if (!success) {
    // A lost fight costs the tokens (they were spent when the fight started).
    return { save: s, result: { bossId: def.id, difficulty: b.difficulty, success: false, exp: 0, gold: 0, tokensKept: false } };
  }
  const region = regionOfBoss(def.id)!;
  const d = BOSS_DIFFICULTY[b.difficulty];
  const drop = rollBossDrop(b.difficulty, rng);
  const familiarId =
    !s.familiars.owned.includes(def.familiar.id) &&
    rng() < FAMILIAR_BASE_CHANCE * d.familiar + FAMILIAR_LUCK_PER_POINT * totalStats(s.player).luck
      ? def.familiar.id
      : undefined;
  const prog = s.world.regions[region.id] ?? { cleared: [], mementos: [], bossDefeated: false };
  return {
    save: { ...s, world: { ...s.world, regions: { ...s.world.regions, [region.id]: { ...prog, bossDefeated: true } } } },
    result: {
      bossId: def.id,
      difficulty: b.difficulty,
      success: true,
      exp: Math.round(BOSS_BASE.exp * region.rewardScale * d.reward),
      gold: Math.round(BOSS_BASE.gold * region.rewardScale * d.reward),
      ...(drop ? { drop: { gearId: drop.id } } : {}),
      ...(familiarId ? { familiarId } : {}),
    },
  };
}
