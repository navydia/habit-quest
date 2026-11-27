export type DayKey = string; // "YYYY-MM-DD", local
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type Schedule = { kind: 'daily' } | { kind: 'weekdays'; days: Weekday[] };

export interface Habit {
  id: string;
  name: string;
  schedule: Schedule;
  createdAt: string;
  archived: boolean;
}

export interface Completion {
  habitId: string;
  dayKey: DayKey;
  at: string; // ISO timestamp
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface QuestOffer {
  id: string;
  templateId: string;
  name: string;
  flavour: string;
  difficulty: Difficulty;
  requiredPower: number;
  rewardExp: number;
  rewardGold: number;
  regionId?: string;
}

export type BossDifficulty = 'normal' | 'hard' | 'extreme';

export interface QuestRun {
  offer: QuestOffer;
  dayKey: DayKey;
  startedAt: string;
  successChance: number;
  /** habitId|dayKey of completions that existed at start; re-checking them gives no time cut. */
  preStartKeys?: string[];
  /** Speed multiplier fixed at start, so later stat changes don't move the return time. */
  speedFactor?: number;
  /** A boss fight added to this trip (6 tokens spent at start). */
  boss?: {
    bossId: string;
    difficulty: BossDifficulty;
    successChance: number;
    prevEpoch: string | null;
    prevSpentKeys?: string[];
    prevBonus?: number;
  };
}

export interface QuestResult {
  offer: QuestOffer;
  success: boolean;
  exp: number;
  gold: number;
  resolvedAt: string;
  /** Quest-log anecdote. Optional so older saves still load. */
  story?: string;
  drop?: { gearId: string };
  memento?: { regionId: string; mementoId: string };
  boss?: {
    bossId: string;
    difficulty: BossDifficulty;
    success: boolean;
    exp: number;
    gold: number;
    drop?: { gearId: string };
    familiarId?: string;
    /** On a loss: whether the 6 tokens came back (not if the boss habit was switched mid-trip). */
    tokensKept?: boolean;
  };
}

export type StatKey = 'power' | 'defense' | 'luck' | 'speed';
export type Stats = Record<StatKey, number>;
export type Slot = 'weapon' | 'head' | 'body' | 'feet' | 'accessory';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type WeaponType = 'sword' | 'bow' | 'staff';

/** One owned copy of a catalog item. */
export interface GearItem {
  uid: string;
  gearId: string;
  obtainedAt: string;
}

export interface Player {
  level: number;
  exp: number;
  gold: number;
  unspentSp: number;
  spentSp: number;
  stats: Stats;
  inventory: GearItem[];
  /** Slot → uid of the equipped item. */
  equipped: Partial<Record<Slot, string>>;
  title: string;
}

export interface RegionProgress {
  cleared: string[];
  mementos: string[];
  bossDefeated: boolean;
}

export interface SaveData {
  version: 3;
  player: Player;
  habits: Habit[];
  completions: Completion[];
  board: { dayKey: DayKey; offers: QuestOffer[] } | null;
  activeRun: QuestRun | null;
  pendingResult: QuestResult | null;
  lastQuestStartedDayKey: DayKey | null;
  questLog: QuestResult[];
  world: { currentRegion: string; regions: Record<string, RegionProgress> };
  boss: {
    habitId: string | null;
    tokenEpoch: string | null;
    /** habitId|dayKey of completions already spent on a fight; re-checking them earns nothing. */
    spentKeys?: string[];
    /** Tokens given back (a lost fight) or granted by the debug menu. */
    bonusTokens?: number;
  };
  familiars: { owned: string[]; active: string | null };
}
