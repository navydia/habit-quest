export type DayKey = string; // "YYYY-MM-DD", local
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type Schedule = { kind: 'daily' } | { kind: 'weekdays'; days: Weekday[] } | { kind: 'interval'; every: number; /** Day the repeat counts from (defaults to the creation day). */ from?: DayKey };
export type LifeArea = 'health' | 'mind' | 'work' | 'home' | 'social' | 'learning' | 'fun' | 'other';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  schedule: Schedule;
  createdAt: string;
  archived: boolean;
  emoji: string;
  lifeArea: LifeArea;
  timeOfDay: TimeOfDay;
  /** Position in the creator's custom order (lower first). */
  order?: number;
}

export interface Completion {
  habitId: string;
  dayKey: DayKey;
  at: string; // ISO timestamp
  /** Removed from the History menu. Still counts as done. */
  hidden?: boolean;
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
  /** 'boss' = a boss fight that takes the place of the day's adventure. Missing = adventure. */
  kind?: 'adventure' | 'boss';
  offer: QuestOffer;
  dayKey: DayKey;
  startedAt: string;
  successChance: number;
  /** habitId|dayKey of completions that existed at start; re-checking them gives no time cut. */
  preStartKeys?: string[];
  /** Speed multiplier fixed at start, so later stat changes don't move the return time. */
  speedFactor?: number;
  /** Potion drunk before this trip (its effects are baked into the run). */
  potion?: string;
  luckBonus?: number;
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
  kind?: 'adventure' | 'boss';
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

export interface DailyQuest {
  id: string;
  kind: string;
  event: string;
  title: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export type Skin = 'fair' | 'light' | 'tan' | 'brown' | 'deep';
export type HairStyle = 'short' | 'long' | 'curly' | 'bun';
export type HairColor = 'black' | 'brown' | 'auburn' | 'blonde' | 'silver' | 'teal';
export type EyeColor = 'dark' | 'brown' | 'green' | 'blue' | 'violet';
export type Ears = 'round' | 'pointed';
export type Pronouns = 'he' | 'she' | 'they';
export interface Look {
  skin: Skin;
  hairStyle: HairStyle;
  hairColor: HairColor;
  eyes: EyeColor;
  ears: Ears;
}
export interface Profile {
  name: string;
  titleId: string;
  pronouns: Pronouns;
  look: Look;
  /** 'home' or a region id: the picture behind the character box. */
  background: string;
}

export interface SaveData {
  version: 6;
  player: Player;
  habits: Habit[];
  completions: Completion[];
  board: { dayKey: DayKey; offers: QuestOffer[] } | null;
  activeRun: QuestRun | null;
  pendingResult: QuestResult | null;
  lastQuestStartedDayKey: DayKey | null;
  questLog: QuestResult[];
  /** currentRegion: where adventures come from. atHome: whether the hero is shown at home or out in that region. */
  world: { currentRegion: string; regions: Record<string, RegionProgress>; atHome?: boolean };
  profile: Profile;
  /** Development only: how far the Debug menu has moved the clock forward. */
  dev: { offsetMs: number };
  boss: {
    habitId: string | null;
    tokenEpoch: string | null;
    /** habitId|dayKey of completions already spent on a fight; re-checking them earns nothing. */
    spentKeys?: string[];
    /** Tokens given back (a lost fight) or granted by the debug menu. */
    bonusTokens?: number;
  };
  familiars: { owned: string[]; active: string | null };
  settings: { groupBy: 'timeOfDay' | 'lifeArea' | 'custom' };
  /** Armory slots bought today. */
  shop: { dayKey: DayKey | null; bought: string[] };
  potions: { owned: Record<string, number>; active: string | null };
  daily: { dayKey: DayKey | null; quests: DailyQuest[] };
}
