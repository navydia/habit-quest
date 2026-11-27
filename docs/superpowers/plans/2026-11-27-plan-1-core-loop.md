# Habit Quest — Plan 1: Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable app where you create habits, check them off, fill the quest gauge, pick a daily quest, watch your hero go out for 8 hours (shortened by later habits), get notified on return, and collect EXP and gold that level you up. All progress is saved on the device.

**Architecture:** All game rules live in `src/game/` as **pure TypeScript functions**. They take `now: Date` and an `rng: () => number` as parameters, so they're fully unit-testable with no React or device involved. A single **Zustand store** holds one versioned `SaveData` JSON object and calls the pure functions. The store persists to on-device storage through a migration layer. Screens use **Expo Router** tabs. Quest timing is always **derived from timestamps** (start time + completion records), never from a running timer.

**Tech Stack:** Expo SDK (latest stable, 57+), TypeScript (strict), Expo Router with native tabs, Zustand, `expo-sqlite/kv-store`, `expo-notifications`, `expo-haptics`, `react-native-svg`, `@expo-google-fonts/fraunces` + `nunito-sans`, Jest with `jest-expo`, `@testing-library/react-native`.

**Style:** `docs/design/style-guide.md` governs every screen and placeholder.

**Spec:** `docs/superpowers/specs/2026-11-27-habit-quest-design.md`

## Global Constraints

- No penalty for missing habits, ever. Nothing decays, nothing is lost by inaction (spec §2).
- Quest gauge full at `ceil(0.6 × scheduled habits today)`, minimum 1 (spec §5.1).
- One quest started per day (spec §5.1).
- Quest base duration **8 h**; each completion after start cuts **20 min**; habit reductions floor at **5 h** (spec §5.3).
- Failed quest pays **25%** of success rewards, never zero (spec §5.4).
- Day boundary = local midnight. Keep `DAY_START_HOUR = 0` as a single constant in `src/game/config.ts` so it can be changed later (spec §4).
- Completions are stored as dated records `{ habitId, dayKey, at }`, not flags (spec §5.6).
- Every save has a `version` number and goes through `migrate()` on load (spec §12.1).
- All tuning numbers live in `src/game/config.ts`; all quest content lives in `src/content/` (spec §12.1).
- Rules functions never call `Date.now()` or `Math.random()` directly.
- No real-money purchases (spec §12.1).

## Review Focus

1. **App closed for the whole quest.** The user starts a quest, kills the app, and opens it 10 hours later. Expected: the hero has returned and rewards are ready to collect. *(Test in Task 5.)*
2. **No habits scheduled today.** The gauge target is 1 but there's nothing to check. Expected: no crash and no divide-by-zero; the gauge stays at 0 and Home shows "Add a habit to start your journey." *(Test in Task 3.)*
3. **Unchecking after the quest started.** Expected: the quest stays started, and its end time moves back later by 20 min. *(Test in Task 5.)*
4. **Daylight-saving day / late-night use.** A completion at 23:59 and one at 00:01 belong to different days. A DST-change day still yields the correct `dayKey`. *(Test in Task 2.)*
5. **Corrupt or unknown save data.** Expected: no crash. Start a fresh save and keep the raw text under a backup key. *(Test in Task 6.)*

---

## File Structure

```
app/                         Expo Router screens
  _layout.tsx                root layout: loads save, renders tabs
  (tabs)/_layout.tsx         4 tabs: Home, Character, City, Board
  (tabs)/index.tsx           Home
  (tabs)/character.tsx       placeholder "Coming soon" + level/EXP/gold
  (tabs)/city.tsx            placeholder
  (tabs)/board.tsx           placeholder
src/game/                    pure rules, no React
  config.ts                  all tuning constants
  types.ts                   SaveData and domain types
  dates.ts                   dayKey, isSameDay helpers
  habits.ts                  schedules, completions
  gauge.ts                   gauge target/progress/readiness
  quests.ts                  board generation, success chance, rewards
  questRun.ts                start, end time, resolve
  progression.ts             EXP, levels, power rating
  rng.ts                     seeded RNG
src/content/quests.ts        quest name/flavour pool
src/save/
  migrate.ts                 versioned migrations
  storage.ts                 load/save via kv-store
src/store/gameStore.ts       Zustand store; actions call src/game
src/notify/questNotifications.ts
src/ui/                      Home components
  HeroPlaceholder.tsx, QuestGauge.tsx, HabitList.tsx,
  AddHabitSheet.tsx, QuestBoardSheet.tsx, ReturnReveal.tsx
__tests__/ mirrors src/
```

---

### Task 1: Scaffold the app

**Files:** Create the project in the repo root; `app/(tabs)/*`; `jest.config.js`; `__tests__/smoke.test.ts`

**Interfaces:** Produces the 4-tab shell and a working `npm test`.

- [ ] **Step 1:** `npx create-expo-app@latest . --template tabs` (repo root already holds `docs/`; move `docs/` aside and back if the tool refuses a non-empty directory). Enable `"strict": true` in `tsconfig.json`.
- [ ] **Step 2:** Replace the template tabs with four: `index` "Home", `character` "Character", `city` "City", `board` "Board". Each non-Home tab shows a centered "Coming soon" text. Delete leftover template screens and components.
- [ ] **Step 3:** `npx expo install jest-expo jest @types/jest @testing-library/react-native zustand expo-sqlite expo-notifications`. Set `"test": "jest"` and jest `preset: "jest-expo"`.
- [ ] **Step 4:** Write `__tests__/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Run `npm test` → PASS.
- [ ] **Step 5:** `npx tsc --noEmit` → no errors. `npx expo start` launches without error (manual check on device via Expo Go).
- [ ] **Step 6:** Commit `chore: scaffold Expo app with four tabs and Jest`.

### Task 2: Config, types, dates, RNG

**Files:** Create `src/game/config.ts`, `types.ts`, `dates.ts`, `rng.ts`; Test `__tests__/game/dates.test.ts`, `rng.test.ts`

**Interfaces — Produces:**
```ts
// config.ts
export const DAY_START_HOUR = 0;
export const GAUGE_FRACTION = 0.6;
export const QUEST_BASE_MS = 8 * 3600_000;
export const QUEST_CUT_MS = 20 * 60_000;
export const QUEST_FLOOR_MS = 5 * 3600_000;
export const FAIL_REWARD_FRACTION = 0.25;
export const BOARD_SIZE = 3;
export const SP_PER_LEVEL = 3;
// types.ts
export type DayKey = string;                       // "YYYY-MM-DD", local
export type Weekday = 0|1|2|3|4|5|6;               // 0 = Sunday
export type Schedule = { kind: 'daily' } | { kind: 'weekdays'; days: Weekday[] };
export interface Habit { id: string; name: string; schedule: Schedule; createdAt: string; archived: boolean }
export interface Completion { habitId: string; dayKey: DayKey; at: string }  // at = ISO timestamp
export type Difficulty = 'easy' | 'normal' | 'hard';
export interface QuestOffer { id: string; templateId: string; name: string; flavour: string;
  difficulty: Difficulty; requiredPower: number; rewardExp: number; rewardGold: number }
export interface QuestRun { offer: QuestOffer; dayKey: DayKey; startedAt: string; successChance: number }
export interface QuestResult { offer: QuestOffer; success: boolean; exp: number; gold: number; resolvedAt: string }
export interface Player { level: number; exp: number; gold: number; unspentSp: number }
export interface SaveData { version: 1; player: Player; habits: Habit[]; completions: Completion[];
  board: { dayKey: DayKey; offers: QuestOffer[] } | null;
  activeRun: QuestRun | null; pendingResult: QuestResult | null;
  lastQuestStartedDayKey: DayKey | null; questLog: QuestResult[] }
// dates.ts
export function dayKey(d: Date): DayKey;          // local date shifted by DAY_START_HOUR
export function weekdayOf(key: DayKey): Weekday;
export function endOfDay(key: DayKey): Date;      // start of next day, local
// rng.ts
export function seededRng(seed: string): () => number;   // deterministic, [0,1)
```

- [ ] **Step 1: Failing tests:** `dayKey(new Date(2026,10,27,23,59))` → `"2026-11-27"`; `dayKey(new Date(2026,10,28,0,1))` → `"2026-11-28"`; `dayKey(new Date(2026,2,8,12))` → `"2026-03-08"` (US DST day); `weekdayOf("2026-11-27")` → `5`; `endOfDay("2026-11-27").getDate()` → `28`; `seededRng("a")()` equals itself across two calls of `seededRng("a")` and all values lie in `[0,1)`.
- [ ] **Step 2:** `npm test` → FAIL (modules missing).
- [ ] **Step 3:** Implement. `seededRng`: hash the string (cyrb53 or similar) into mulberry32.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: add game config, types, dates and seeded rng`.

### Task 3: Habits and quest gauge

**Files:** Create `src/game/habits.ts`, `src/game/gauge.ts`; Test `__tests__/game/habits.test.ts`, `gauge.test.ts`

**Interfaces — Produces:**
```ts
export function isScheduledOn(h: Habit, key: DayKey): boolean;   // excludes archived
export function scheduledHabits(habits: Habit[], key: DayKey): Habit[];
export function isCompleted(c: Completion[], habitId: string, key: DayKey): boolean;
export function complete(c: Completion[], habitId: string, key: DayKey, now: Date): Completion[]; // no-op if already
export function uncomplete(c: Completion[], habitId: string, key: DayKey): Completion[];
export function canLogDay(key: DayKey, now: Date): boolean;     // today or yesterday only (spec §5.6)
// gauge.ts
export function gaugeTarget(scheduledCount: number): number;    // max(1, ceil(0.6*n))
export function gaugeProgress(s: SaveData, key: DayKey): { done: number; target: number; full: boolean; hasHabits: boolean };
export function canStartQuest(s: SaveData, now: Date): boolean;
```
`gaugeProgress.done` counts completions for `key` of habits scheduled on `key`. `canStartQuest` is true when: today's gauge is full, `lastQuestStartedDayKey !== today`, `activeRun === null`, and `pendingResult === null`. This gives the spec §5.5 rule ("ready as soon as the hero returns") for free: once the run resolves and is collected, the check passes. An unused ready quest simply stops qualifying when the day changes.

- [ ] **Step 1: Failing tests:** `gaugeTarget(0)`→1, `(1)`→1, `(3)`→2, `(5)`→3, `(10)`→6. A weekday habit `{days:[1,3]}` is scheduled on Monday 2026-11-23 and not on Tuesday. `complete` twice yields one record. `canLogDay` is true for today and yesterday, false for two days ago. **Review Focus 2:** with zero habits, `gaugeProgress` → `{done:0,target:1,full:false,hasHabits:false}`. With 5 habits and 3 complete → full. `canStartQuest` is false when `lastQuestStartedDayKey` is today, false while `activeRun` is set, and true the next day after collecting while yesterday's run had been active (the §5.5 case).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: habits, completions and quest gauge`.

### Task 4: Progression and quest board

**Files:** Create `src/game/progression.ts`, `src/game/quests.ts`, `src/content/quests.ts`; Test `__tests__/game/progression.test.ts`, `quests.test.ts`

**Interfaces — Produces:**
```ts
// progression.ts
export function expToNext(level: number): number;          // 100 * level
export function powerRating(level: number): number;        // 100 + 15*(level-1); stat/gear terms added in Plan 2
export function addExp(p: Player, exp: number): { player: Player; levelsGained: number };  // grants SP_PER_LEVEL per level, carries overflow
// content/quests.ts
export interface QuestTemplate { id: string; name: string; flavour: string }
export const QUEST_TEMPLATES: QuestTemplate[];             // at least 12 entries, cozy-serious tone
// quests.ts
export const DIFFICULTY: Record<Difficulty, { offsetMin: number; offsetMax: number; rewardMult: number }>;
//   easy {-60, 0, 1}, normal {10, 50, 1.6}, hard {35, 90, 3}
export function successChance(power: number, required: number): number;
export function generateBoard(key: DayKey, player: Player, rng: () => number): QuestOffer[];  // one of each difficulty, distinct templates
```
Success chance is a step function, set by the creator. `power >= required` → **1.0**. `required - power <= 50` → **0.6**. Otherwise → **0.05**. Put the thresholds in config as `SUCCESS_BANDS`.
`requiredPower = powerRating(level) + offset`, where `offset` is an integer in `[offsetMin, offsetMax]` drawn from the rng. So easy is always 100%, normal is always 60%, and hard is sometimes a 60% gamble and sometimes a 5% long shot. Crossing that 50-point line is what stats and potions will matter for later.
Base rewards: `exp = round(40 * rewardMult * (1 + 0.1*(level-1)))`, `gold = round(20 * rewardMult * (1 + 0.1*(level-1)))`.

- [ ] **Step 1: Failing tests:** `expToNext(1)`→100. `addExp({level:1,exp:90,...},30)` → level 2, exp 20, unspentSp +3, levelsGained 1. `addExp` across two levels grants 6 SP. `successChance(100,100)`→1. `(150,100)`→1. `(100,101)`→0.6. `(100,150)`→0.6. `(100,151)`→0.05. `generateBoard` with `seededRng("2026-11-27")` at level 1 returns 3 offers with difficulties `easy, normal, hard`, distinct `templateId`s, `requiredPower` in `[40..100]`, `[110..150]` and `[135..190]` respectively, and `rewardExp` `[40,64,120]`. It is identical on a second call with the same seed. Over 200 seeds, the hard offer lands in both the 0.6 and 0.05 bands at least once.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement, and write the 12+ quest templates (e.g. "Slime Patrol — The meadow slimes are bouncing into the farm fields again.").
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: progression and daily quest board`.

### Task 5: Quest runs

**Files:** Create `src/game/questRun.ts`; Test `__tests__/game/questRun.test.ts`

**Interfaces — Consumes:** Tasks 2–4. **Produces:**
```ts
export function startQuest(s: SaveData, offerId: string, now: Date): SaveData;   // throws if !canStartQuest
export function questEndTime(run: QuestRun, completions: Completion[]): Date;
export function isReturned(run: QuestRun, completions: Completion[], now: Date): boolean;
export function resolveQuest(s: SaveData, now: Date, rng: () => number): SaveData; // if returned: sets pendingResult, clears activeRun, appends questLog
export function collectResult(s: SaveData): { save: SaveData; levelsGained: number }; // applies exp/gold via addExp, clears pendingResult
```
`questEndTime`: let `n` be the number of completions with `at >= run.startedAt`, regardless of `dayKey`, so backfilled yesterday-habits count too (spec §5.6). Duration is `max(QUEST_FLOOR_MS, QUEST_BASE_MS - n*QUEST_CUT_MS)`. Because the end time is derived, unchecking a habit lengthens the run again automatically. `startQuest` stores `successChance` at start time. The board for the day is regenerated in the store (Task 8), not here. `resolveQuest` rolls `rng() < successChance`; on failure, rewards are `round(reward * FAIL_REWARD_FRACTION)`.

- [ ] **Step 1: Failing tests:** a run started at 09:00 with 0 later completions ends at 17:00. With 3 completions after the start, it ends at 16:00. With 20, it ends at 14:00 (the floor). A completion timestamped before the start doesn't count. **Review Focus 3:** after removing a post-start completion, the end time moves 20 min later and `activeRun` is still set. **Review Focus 1:** a save with a run started at 09:00, resolved at 19:00 the same day, gives `pendingResult` and `activeRun: null`. `resolveQuest` before the end time returns the save unchanged. With an rng that returns 0.99 and a chance of 0.6, the result is a failure with exp `round(40*0.25)=10`. `startQuest` throws when a quest was already started today. `collectResult` adds gold and levels up.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: quest runs with derived end time and resolution`.

### Task 6: Save migration and storage

**Files:** Create `src/save/migrate.ts`, `src/save/storage.ts`; Test `__tests__/save/migrate.test.ts`

**Interfaces — Produces:**
```ts
export const CURRENT_VERSION = 1;
export function newSave(): SaveData;      // level 1, 0 exp, 0 gold, 0 sp, empty lists, nulls
export function migrate(raw: unknown): { save: SaveData; recovered: boolean };  // recovered=true when raw was unusable
// storage.ts
export async function loadSave(): Promise<SaveData>;  // key "save"; on recovered, writes raw text to "save-backup-<ISO>"
export async function writeSave(s: SaveData): Promise<void>;
```
`migrate` handles input as follows. `null`/`undefined` → `newSave()`, recovered false. A valid v1 object → passes through. An object with a missing or unknown `version`, a non-object, or a v1 object missing required arrays → `newSave()` with recovered true. Keep a `MIGRATIONS: Record<number, (s:any)=>any>` map (empty for now) that's applied in order, so v2 can be added later.

- [ ] **Step 1: Failing tests:** `migrate(undefined)` → fresh save, not recovered. A round trip through `JSON.parse(JSON.stringify(save))` stays equal. **Review Focus 5:** `migrate("garbage")`, `migrate({version: 99})`, and `migrate({version:1})` (missing fields) each return a fresh save with `recovered: true` and don't throw.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; `storage.ts` uses `Storage` from `expo-sqlite/kv-store` (`getItem`/`setItem`).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: versioned save with migration and recovery`.

### Task 7: Quest notifications

**Files:** Create `src/notify/questNotifications.ts`; Test `__tests__/notify/questNotifications.test.ts`

**Interfaces — Produces:**
```ts
export async function ensurePermission(): Promise<boolean>;
export async function scheduleReturn(endTime: Date): Promise<void>;  // cancels previous, schedules "Your hero has returned!"
export async function cancelReturn(): Promise<void>;
```
Use one fixed notification identifier (`"quest-return"`) so rescheduling replaces the old notification instead of stacking another. Skip scheduling if `endTime` is in the past.

- [ ] **Step 1: Failing test** (with `expo-notifications` mocked via `jest.mock`): `scheduleReturn(future)` calls `cancelScheduledNotificationAsync("quest-return")` and then `scheduleNotificationAsync` with `identifier: "quest-return"` and body text `"Your hero has returned!"`. A past date schedules nothing.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: quest return notification`.

### Task 8: Game store

**Files:** Create `src/store/gameStore.ts`; Test `__tests__/store/gameStore.test.ts`

**Interfaces — Consumes:** Tasks 2–7. **Produces:**
```ts
interface GameState {
  save: SaveData; loaded: boolean;
  load(): Promise<void>;
  addHabit(name: string, schedule: Schedule, now?: Date): void;
  archiveHabit(id: string): void;
  toggleHabit(habitId: string, key: DayKey, now?: Date): void;   // respects canLogDay
  ensureBoard(now?: Date): void;            // generates board if missing or not today's; seed = dayKey
  startQuest(offerId: string, now?: Date): void;
  tick(now?: Date): void;                   // calls resolveQuest; call on app foreground and every 60 s
  collect(): number;                        // returns levelsGained
}
export const useGameStore: UseBoundStore<StoreApi<GameState>>;
```
`now` defaults to `new Date()`, and `rng` is `Math.random` except for the board, which uses `seededRng(dayKey)`. Every mutating action writes the save through `writeSave`. Every action that can change the active run's end time (`toggleHabit`, `startQuest`) calls `scheduleReturn(questEndTime(...))`.

- [ ] **Step 1: Failing tests** (with storage and notifications mocked): add 2 habits → toggle 2 on today → `canStartQuest` is true. `startQuest` sets `activeRun` and calls `scheduleReturn` with start + 8 h. Toggling a habit off reschedules with a later time. `tick` 9 h later followed by `collect()` gives the player gold > 0. Toggling a habit three days ago does nothing.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: game store wiring rules, storage and notifications`.

### Task 9: Design system

**Files:** Create `src/theme/tokens.ts`, `src/theme/useTheme.ts`, `src/theme/fonts.ts`, `src/ui/kit/{Text,Button,Card,ProgressBar,Sheet,Checkbox}.tsx`; Modify `app/_layout.tsx` (font loading), `app/(tabs)/_layout.tsx` (switch to Expo Router **native tabs** with SF Symbols / Material icons: house, figure, building, envelope); Test `__tests__/theme/contrast.test.ts`

**Interfaces — Produces:** `useTheme(): { c: ColorTokens; t: TypeStyles; space; radius }` following the system color scheme. Kit components consume only tokens. `Button({ title, onPress, variant: 'primary'|'secondary', disabled })` is tactile, with a lip and a spring press, plus a haptic. `ProgressBar({ value: 0..1, tone })` animates its fill.

All values come from `docs/design/style-guide.md` §3–§6: tokens, Fraunces + Nunito Sans via `@expo-google-fonts`, radii, lip, motion, haptics (`expo-haptics`), Reduce Motion (`AccessibilityInfo`), and 44-pt minimum targets.

- [ ] **Step 1: Failing test:** a `contrastRatio(a,b)` helper (in `src/theme/contrast.ts`) shows every text/background pair in both modes ≥ 4.5: `text/bg`, `text/surface`, `textMuted/surface`, `onPrimary/primary`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement tokens, fonts, kit, and native tabs. **Step 4:** Run → PASS; `tsc` clean.
- [ ] **Step 5:** Commit `feat: design system tokens, type and UI kit`.

### Task 10: Home screen

All UI uses the Task 9 kit and tokens and follows the style guide. No raw colors or font sizes in screens.

**Files:** Modify `app/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/character.tsx`; Create the `src/ui/*` files listed in File Structure; Test `__tests__/ui/home.test.tsx`

**Interfaces — Consumes:** `useGameStore`.

Layout, top to bottom: the hero area (about 45% of the height), the gauge row, then the habit list with an "+ Add habit" button.
- `HomeScene` draws a full-bleed dusk scene (style guide §3 scene palette) in `react-native-svg`. Idle shows an indoor corner of a cottage with a lamp; questing shows outdoors with hills.
- `HeroPlaceholder({ mode: 'idle' | 'questing' })` is drawn in SVG per style guide §7: a bean body, dot eyes with highlights, a cloak and scarf, a sword while questing, and a slime that hops in, squashes and poofs. Motion follows §6 and respects Reduce Motion. This component is **replaced by the real art system in Plan 2**, so keep it self-contained.
- While questing, show the time remaining ("Returns in 5h 40m"), updated every 60 s.
- `QuestGauge` shows a bar with `done/target`. When full and `canStartQuest`, it shows a "Choose a quest" button that opens `QuestBoardSheet`. With no habits, it shows "Add a habit to start your journey."
- `QuestBoardSheet` shows 3 cards with name, flavour, difficulty, required power vs your power, success % (100% / 60% / 5%), duration "8h", and EXP/gold. Tapping a card asks for confirmation, then starts the quest. On first start, call `ensurePermission()`.
- `ReturnReveal` appears when `pendingResult` is set: "Your hero has returned!", success or failure line, +EXP, +gold, a level-up banner if `levelsGained > 0`, and a Collect button. Copy follows style guide §8.
- `HabitList` shows today's scheduled habits with checkboxes, plus a collapsible "Yesterday" section listing uncompleted habits from yesterday.
- `AddHabitSheet` has a name field and a schedule choice of Daily or specific weekdays (seven toggles).
- Root `_layout.tsx` calls `load()`, and calls `tick()` on `AppState` "active" and on a 60 s interval.
- The Character tab temporarily shows Level, EXP `x / expToNext`, Gold, Power rating, and unspent SP.

- [ ] **Step 1: Failing test** (`@testing-library/react-native`, store seeded): with 0 habits, Home shows "Add a habit to start your journey". With 1 completed habit, the "Choose a quest" button is visible. With `pendingResult` set, "Your hero has returned!" and "Collect" are visible.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5: Manual check in Expo Go:** add 3 habits, check 2, start a quest, see the fighting animation and countdown, check the third and see the countdown drop 20 min, kill the app and reopen it with the run still going. To test the return, temporarily set `QUEST_BASE_MS` to 2 minutes and `QUEST_FLOOR_MS` to 1 minute: the notification arrives, and the reveal and collect work. Then revert the config.
- [ ] **Step 6:** Commit `feat: Home screen core loop`.

---

## Roadmap (separate plans, written when each is next)

2. **Character & art system:** paper-doll layer renderer, art manifest and folder convention, generated placeholders, art spec doc, art preview screen, stats/SP allocation, gear slots and rarity, class titles, Armory drops. Replaces `HeroPlaceholder`.
3. **Bosses & familiars:** boss habit, tokens, switch-reset confirmation, F–S tiers, boss attached to a quest, familiars and collection.
4. **City:** Armory with weekly premium slot, Cosmetics, Apothecary potions, Tavern weekly bounty.
5. **Housing:** house backgrounds and furniture placement on Home.
6. **Message Board:** Guild Master letter templates and the quest log view.
7. **Save export/import** and pre-release hardening.
