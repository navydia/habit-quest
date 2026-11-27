# Habit Quest — Plan 3: Regions, Bosses, Familiars and Scrapbook

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the random daily board with **regions**. Each region has three fixed adventures, a power requirement, a **boss** and a **scrapbook** of mementos. Add **boss tokens** from a chosen boss habit, **boss fights** (Normal / Hard / Extreme, always 6 tokens) attached to the day's adventure, and **familiars** dropped by bosses.

**Architecture:**
- **Content** (`src/content/regions.ts`): regions, their adventures (reusing the quest-template stories), mementos, bosses and familiars.
- **Pure rules:**
  - `src/game/world.ts`: travel, unlocks and completion.
  - `src/game/bosses.ts`: tokens, boss odds and loot.
  - `src/game/familiars.ts`.
- **Save v3** adds `world`, `boss` and `familiars`, with a migration from v2.
- **UI:**
  - Map sheet (travel and progress) and scrapbook sheet.
  - Boss habit picker.
  - Boss section on the adventure board.
  - Boss, memento and familiar results on the return screen.
  - Familiars on the Character tab.

**Spec:** `docs/superpowers/specs/2026-11-27-habit-quest-design.md`: §6 (bosses), §7.5 (familiars), §13 (regions, now settled), §1a (adventure wording), §1b (Skip also covers bosses, because it resolves the whole trip). **Style:** `docs/design/style-guide.md` §9.

## Settled with the creator
- A region has **3 fixed adventures** (easy, normal, hard) with **fixed required power**, so odds rise 20 → 60 → 100% as you grow.
- The **first successful clear** of each adventure gives a **memento** for that region's scrapbook.
- **Travel on** needs your power to meet the next region's minimum **and** each adventure in the current region cleared at least once.
- **Travel back** to any unlocked region at any time while no adventure is running.
- A region is **complete** when all 3 adventures are cleared and its boss is beaten.
- **One boss per region.** You can fight the boss of any region you've unlocked, from anywhere.
- **Boss difficulty** is Normal, Hard or Extreme, and **always costs 6 tokens**.
  - Effective power: −0, −30 or −60.
  - Rewards: ×1, ×1.75 or ×3.
  - Familiar chance: ×1, ×2 or ×4.

## Builder's calls (all tunable in config or content)
- **Regions**, each adventure listed as easy / normal / hard required power:
  1. Thornwick Meadows: no minimum. Adventures need 90 / 120 / 160 power. Boss Old Bramblehide (140).
  2. Willowmere Marsh: minimum 130. Adventures need 150 / 185 / 225. Boss The Mire Witch (205).
  3. Greystone Hills: minimum 190. Adventures need 210 / 245 / 290. Boss Granite King (275).
  4. Emberpeak Pass: minimum 250. Adventures need 270 / 310 / 360. Boss Cinder Drake (345).
- **Region reward scale:** 1, 1.5, 2.2, 3. Adventure rewards are `40 / 20 × difficulty mult (1, 1.6, 3) × region scale`. This replaces the old level scaling.
- **Boss rewards** are `150 EXP / 80 gold × region scale × difficulty mult`.
- **Boss odds:** `successChance(power + 2 × Defense − difficulty penalty, boss required power)`.
- **Boss loot:**
  - Always one gear drop, never common. Weights: uncommon 50, rare 35, epic 12, legendary 3.
  - Hard and Extreme move 10 or 20 points from uncommon to epic and legendary, split 2:1.
- **Familiar drop:** 10% × difficulty mult. Each boss has one familiar, and you can't get the same one twice.
- **Familiars:**
  - Bonuses: +3% to +6% EXP or gold, shown on the card.
  - One is active at a time. The bonus applies when a result is collected.
- **Boss tokens:**
  - Tokens = completions of the boss habit made **after the token epoch**, capped at 6.
  - Spending tokens or switching the boss habit moves the epoch to "now".
  - Losing a fight restores the previous epoch, so you keep your tokens.
  - Unchecking a completion that came after the epoch removes its token, unless the tokens were already spent.
- **Boss in a trip:**
  - The boss fight is added when starting the day's adventure, if you have 6 tokens.
  - It's one trip and one return. The adventure and the boss are rolled separately at return time (spec §6.2).
- **Event regions:** the data model supports `availableFrom` / `availableUntil`. No event content is shipped yet.

## Review Focus
1. **v2 save mid-adventure:** it migrates, the run's offer still resolves, and the world starts in Thornwick Meadows.
2. **Unchecking the boss habit after a fight started:** the spent tokens stay spent, and the trip is unchanged.
3. **Losing a boss fight:** you keep 6 tokens and can fight again tomorrow.
4. **Travelling while an adventure is running** is refused, with a message saying why.
5. **Removed or unknown region or boss ids in a save:** no crash. Fall back to Thornwick Meadows.

---

### Task 1: Content and save v3
**Files:**
- Create `src/content/regions.ts`.
- Modify `src/game/types.ts` and `src/save/migrate.ts`.
- Tests: `__tests__/content/regions.test.ts` and `__tests__/save/migrate.test.ts`.

**Produces:**
```ts
interface AdventureDef { id /* = quest template id */; difficulty; requiredPower; memento: { id; name; description } }
interface BossDef { id; name; flavour; requiredPower; familiar: { id; name; bonus: { kind: 'exp'|'gold'; pct: number } } }
interface RegionDef { id; name; minPower; rewardScale; adventures: [AdventureDef, AdventureDef, AdventureDef]; boss: BossDef; availableFrom?: string; availableUntil?: string }
REGIONS: RegionDef[]; regionById(id); bossById(id)
SaveData.version: 3
SaveData.world: { currentRegion: string; regions: Record<string, { cleared: string[]; mementos: string[]; bossDefeated: boolean }> }
SaveData.boss: { habitId: string | null; tokenEpoch: string | null }
SaveData.familiars: { owned: string[]; active: string | null }
QuestOffer.regionId?: string
QuestRun.boss?: { bossId; difficulty: 'normal'|'hard'|'extreme'; successChance; prevEpoch: string | null }
QuestResult.boss?: { bossId; difficulty; success; exp; gold; drop?: { gearId }; familiarId?: string }
QuestResult.memento?: { regionId; mementoId }
```
**Tests:**
- Each region has 3 adventures (easy, normal, hard).
- Adventure ids exist in `QUEST_TEMPLATES`.
- Region minimums ascend.
- All memento and familiar ids are unique.
- v2 → v3 migration keeps the active run, with world, boss and familiar defaults.

### Task 2: World rules and the region board
**Files:**
- Create `src/game/world.ts`.
- Modify `src/game/quests.ts`, `questRun.ts` and `config.ts`.
- Tests: `__tests__/game/world.test.ts`, updated `quests.test.ts` and `questRun.test.ts`.

**Produces:**
```ts
currentRegion(s): RegionDef            // unknown id → first region
generateBoard(key, player, rng, regionId = REGIONS[0].id): QuestOffer[]   // the region's 3 adventures, ids `${key}-${difficulty}`, fixed power, region-scaled rewards
canTravel(s, regionId, now): { ok: true } | { ok: false; reason: string }
travel(s, regionId, now): SaveData       // switches region, clears today's board unless an adventure was started today
isRegionUnlocked(s, regionId): boolean; isRegionComplete(s, regionId): boolean
recordClear(s, offer): { save; memento? }  // used by resolveQuest on success
```
- `resolveQuest` calls `recordClear` on success and puts `memento` on the result.

**Tests:**
- Fixed board per region.
- Travel is refused while an adventure is running, for low power, and when the current region isn't cleared.
- Travel back is always allowed.
- A first clear gives the memento once.
- A region is complete only with its boss.

### Task 3: Boss tokens, fights and familiars
**Files:**
- Create `src/game/bosses.ts` and `src/game/familiars.ts`.
- Modify `questRun.ts` and `config.ts`.
- Test: `__tests__/game/bosses.test.ts`.

**Produces:**
```ts
bossTokens(s): number                     // 0..6
availableBosses(s): BossDef[]             // bosses of unlocked regions
bossChance(p, boss, difficulty): number
setBossHabit(s, habitId, now): SaveData   // resets epoch
startQuest(s, offerId, now, boss?: { bossId; difficulty }): SaveData   // spends tokens when boss given; throws if < 6
// resolveQuest also resolves run.boss; collectResult applies boss rewards, drop, familiar, active-familiar bonus
familiarBonus(s): { exp: number; gold: number }   // multipliers
```
**Tests:**
- Tokens count only after the epoch and cap at 6.
- Unchecking after the epoch removes a token.
- Spending moves the epoch.
- A loss restores the epoch.
- A win marks `bossDefeated` and drops non-common gear.
- Hard odds are lower than Normal.
- The familiar never drops twice.
- An active familiar boosts the collected rewards.
- Skip resolves the boss too.

### Task 4: Store actions
**Files:** `src/store/gameStore.ts`, plus its test.

**Produces:** `travel(regionId)`, `setBossHabit(habitId)`, `startQuest(offerId, now?, boss?)`, `setActiveFamiliar(id | null)`. `ensureBoard` uses the current region.

**Tests:**
- Travelling changes the board.
- The boss habit switch resets tokens.
- Starting with a boss spends tokens.

### Task 5: UI
**Files:**
- Create `src/ui/world/MapSheet.tsx`, `ScrapbookSheet.tsx` and `BossHabitSheet.tsx`.
- Modify `QuestBoardSheet`, `QuestStatus`, `HabitList`, `ReturnReveal`, `HomeScreen` and `app/(tabs)/character.tsx`.
- Tests in `__tests__/ui/`.

**Contents:**
- **Region chip (Home HUD):** a button labelled with the region name that opens the map.
- **Map sheet:** one card per region with its name, required power, status (Here / Unlocked / Locked + reason / Complete), adventures cleared (n/3), and the boss beaten or not. Buttons: Travel, Scrapbook.
- **Scrapbook:** the region's 3 mementos, showing found items or a silhouette with the hint "Clear *X* to find this".
- **Adventure gauge card:** a boss-tokens row (◆ x/6) when a boss habit is set. Otherwise a "Choose a boss habit" link.
- **Habit list:** the boss habit gets a ◆ marker. The boss-habit sheet lists the habits, and asks for confirmation before switching if tokens > 0.
- **Board sheet title:** "Adventures in Thornwick Meadows". Cards show a memento hint ("First clear: memento") or "Memento found".
- **Board boss section (6 tokens):** "A boss awaits", a boss picker (available bosses), a difficulty segmented control (Normal / Hard / Extreme with odds), and the "Set out" label includes the boss.
- **Return screen:** a boss result card (win or lose, rewards, loot), plus memento and familiar callouts.
- **Character tab:** a Familiars card with owned familiars, an active toggle and a bonus line. Empty state: "Beat bosses for a chance at a familiar."

**Tests:**
- The map shows the locked reason.
- Travel changes the board title.
- Boss tokens appear once a habit is chosen.
- The boss section appears at 6 tokens.
- The return screen shows a memento.
- The familiar can be set active.
