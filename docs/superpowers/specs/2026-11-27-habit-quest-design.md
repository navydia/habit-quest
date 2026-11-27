# Habit Quest — Design

*"Habit Quest" is a placeholder name. Date: 2026-11-27. Status: approved.*

## 1. Intent

A habit and routine tracker where real-life habits power a cozy, single-player RPG. You check off your habits, your hero goes on quests, earns EXP, gold and gear, and slowly becomes visibly more impressive. Inspired by Finch (gentle, warm, character you care about) and Habitica (RPG progression), but:

- **Gentler than Habitica:** never punished for missing a habit.
- **More RPG than Finch:** levels, stats, gear rarity, tiered bosses, loot.
- **Art:** Finch-like cute style, slightly more serious. Gear visibly changes the character; rarer gear glows / has effects.

The creator is building it themselves with Claude Code, and drawing the final art themselves.

**Audience:** v1 is for the creator and a few friends (installed via Expo / TestFlight / internal testing). A public store release is a likely future step, so build with it in mind: no shortcuts that would block it, but don't build release-only features yet (see §12.1).

## 2. Goals, non-goals, anti-goals

**Goals**
- Completing habits feels rewarding every day, through one clear daily loop (gauge → quest → rewards → letter).
- Long-term pull from gear, bosses, familiars, housing, and level-gated boss tiers.
- The character and their home look better the longer you play.

**Non-goals (v1)**
- Multiplayer, parties, chat, friends.
- Accounts, servers, cloud sync. All data lives on the device.
- Skills / abilities. (Cut.)
- Dyes. (Deferred.)
- Companions who send cheers, event/world bosses. (Deferred.)

**Anti-goals: failure even if it technically works**
- Any penalty for missing habits: no HP loss, no decaying progress, no streak-shame. (One deliberate exception: §6.4 boss-habit switch.)
- Stats becoming a min-maxing puzzle. Stats are light flavor; random SP allocation must still be fine.
- The app feeling like a spreadsheet with a sprite glued on. The character is front and center.

## 1a. Terminology *(creator decision)*

- **Adventure** is the daily outing your hero goes on when the gauge fills: the adventure board, the adventure gauge, "On an adventure", and the adventure log.
- **Quest** is reserved for the **daily quests in the City** (Tavern and similar), which are designed later. Older parts of this spec still say "quest" where they mean adventure.
- Code identifiers keep their `quest…` names for now (for example `startQuest`, `QuestRun`). City quests will use distinct names, such as `cityQuest`.

## 1b. Testing aids

- **Development builds only** (`__DEV__`, which is true in Expo Go): a **"Skip (testing)"** button finishes a running adventure immediately. **Bosses get the same Skip** when they're built.
- Release builds never show it.

## 2a. Look and feel

The visual style, tokens and **UI rules for every screen** live in `docs/design/style-guide.md` (§9 lists the 18 rules). Every new screen and feature follows it, so the app stays consistent as it grows. The most important rules:

- one focal point and one primary action per screen
- gold only for rewards and the main call to action
- never scold missed habits
- sentence case, generous whitespace, and tokens only
- every action gives feedback, and every list has an empty state
- respect Reduce Motion and large text
- inputs always stay visible above the keyboard

## 3. Tabs

1. **Home / Journey**: character, quest gauge, boss tokens, today's habits.
2. **Character**: class title, level, power rating, stats & SP, equipment, familiars collection.
3. **City**: Armory, Cosmetics, Apothecary, Housing, Tavern.
4. **Message Board**: letters from the Guild Master + quest log.

## 4. Habits

- User creates habits (name; schedule — see §11).
- One habit at a time may be the **boss habit** (§6).
- Daily habits reset each day at local midnight (builder may make the day boundary configurable, e.g. 4 AM).

## 5. Daily loop

### 5.1 Quest gauge
- Fills by **share of today's scheduled habits** completed.
- **Full at ~60%** of today's habits (round up; minimum 1 habit).
- Once full, the user may start **one quest per day**.
- Gauge resets daily. An unused full gauge is simply gone the next day — no penalty.

### 5.2 Choosing a quest
- A board of several quests (builder's call: ~3) is generated daily.
- Each quest card shows: name/flavour, **required power rating**, **% chance of success**, duration, rewards (EXP, gold, possible drops).
- Harder quests → lower success chance, bigger rewards. Success chance (set by the creator): power ≥ required → **100%**; up to 50 points short → **60%**; more than 50 short → **20%**. The board always shows all three quests; you pick one each time.
- **Luck** increases the chance that a rare quest appears on the board.
- Potions (§9.3) may be applied before starting.

### 5.3 While questing
- Character on Home is shown fighting (swinging weapon, bonking slimes). Familiar follows behind.
- Base duration **8 hours**.
- Each habit completed **after the quest starts** cuts **20 minutes**, down to a **5-hour floor**.
- **Speed** shortens duration a little further, applied after the habit reduction (may go slightly below 5 h).
- Push notification when it finishes: "Your hero has returned!"

### 5.4 Results
- On return, rewards wait on Home until the user taps to collect (a small reveal moment).
- **Success:** full EXP + gold + chance of gear drop.
- **Failure:** a much smaller reward (builder's call: ~20–25%). Never zero.
- The Guild Master sends a letter about the outcome (§10).
- The return screen has a **Read quest log** button showing a short anecdote about how the quest went (a success or failure story per quest).

### 5.5 Day boundary & overlapping quests *(designer's call)*
- Habit completions always count toward **today's gauge** and, if a quest is running, **also shorten it**, even if that quest started yesterday.
- If today's gauge fills while yesterday's quest is still running, today's quest is **ready to start as soon as the hero returns**. A late-evening quest never costs the next day's quest.
- An unstarted, ready quest expires at the end of the day it became ready. (No penalty; it's just gone.)

### 5.6 Changing habits mid-day *(designer's call)*
- Unchecking a habit the same day reverses its gauge fill, boss token and time reduction, **unless it was already used**: a started quest stays started and a spent token stays spent. This prevents checking and unchecking for free rewards.
- Adding or removing habits recalculates today's gauge target. A gauge that already started a quest is unaffected.
- **Yesterday's habits can be checked off until the end of today** ("I forgot to log it"). They count toward yesterday's bounty and boss token, and can shorten a running quest. They do not fill today's gauge.
- Store completions as dated records (habit, date, timestamp), not as a single on/off flag per habit.

## 6. Bosses

### 6.1 Boss habit & tokens
- User chooses **one boss habit**: something they struggle with. One active at a time.
- Each completion = **1 boss token**. Tokens do not expire.
- At **6 tokens**, a boss fight is available.

### 6.2 Fighting
- The boss fight is added **on top of that day's quest**: you choose a boss when starting the quest, and it resolves with the quest.
- Boss fights have their own success % (Power and **Defense** improve it).
- *(designer's call)* **One trip, one return.** Adding a boss does not lengthen the trip. Speed shortens the whole trip. Quest and boss are **rolled separately, at return time**, so you can win the quest and lose the boss or the other way around. There is one notification and one results reveal showing both outcomes. Potions apply to both.
- **Win:** the most EXP in the game, rare gear, and a **rare chance of the boss's familiar**.
- **Lose:** the boss stays and the **tokens are kept**. The user can retry the next day.
- After a fight (win), tokens are spent. The user may keep the same boss habit or choose a new one.

### 6.3 Tiers
- Tiers **F, E, D, C, B, A, S**, **2 bosses per tier** (14 total).
- Each tier unlocks at a level threshold (builder's call on thresholds).
- When spending tokens, the user **chooses any unlocked boss**, so they can re-fight bosses to farm their loot and familiar.
- **Luck** slightly increases boss loot / familiar odds.

### 6.4 Switching boss habit
- Switching the boss habit **resets tokens to 0**. This is intended to preserve the challenge.
- Switching at 0 tokens (e.g., right after a fight) costs nothing.
- Switching with tokens > 0 shows a confirmation: "You'll lose N tokens — switch anyway?"

### 6.5 Deferred
- Event bosses / world bosses (possibly a shared health bar that all players chip at). Requires a server; not v1.

## 7. Character progression

### 7.1 Level, EXP, power rating
- Quests and bosses give EXP → levels.
- Each level raises **power rating** automatically and grants **SP**.

### 7.2 Stats (SP and gear)
| Stat | Effect |
|---|---|
| Power | Increases power rating; all content slightly easier |
| Defense | Slightly increases boss fight success chance |
| Luck | More rare quests and bosses; slightly better drop odds |
| Speed | Slightly shortens quests and boss fights |

- **Small effects by design.** A stat point is worth at most a few percent. Level and gear rarity are the main progression drivers.
- SP respec: builder's call (suggest free or cheap — strategizing is not the point).

### 7.3 Class (title only)
- Class = **weapon type + highest stat** → a title, e.g. Sword + Speed = "Quick Blade".
- Purely a name. No gameplay difference.
- Ties for highest stat: keep the current title.
- Initial weapon types: Sword, Bow, Staff (builder may add more). The 3×4 title table is content to be written.

### 7.4 Equipment
- Gear slots: builder's call (suggest weapon, head, body, hands/feet, accessory).
- Every piece has a **rarity** and **stat bonuses**. Rarer = more stats and visual glow/effects.
- **Weapon type is cosmetic.** Equal-rarity weapons are equally strong regardless of type. Weapons can be swapped any time.
- Equipped gear changes the character's appearance (layered sprites).
- Rarity tiers: builder's call (e.g., Common, Uncommon, Rare, Epic, Legendary).

### 7.5 Familiars
- Pet versions of bosses; **rare drop** from that boss.
- **One active** at a time.
- Each familiar has its own small bonus (e.g., +3% gold, +4% EXP).
- Stands beside the character when idle; follows behind while questing.
- Collection page in the Character tab, with silhouettes for unowned familiars.

## 8. Home screen & housing

- Idle: the character stands **in their house** (the Home background *is* the house), animated, looking around, familiar beside them.
- Questing: the character is shown fighting out in the field.
- Foreground: quest gauge, boss tokens, today's habit list.
- Housing upgrades and furniture placed via the Housing shop show up here. Housing is **purely cosmetic**.

## 9. City

### 9.1 Armory
- Weapons and armor for gold.
- **One premium slot** holding boss-quality gear, very expensive. **Rotates weekly.** A pity path for players unlucky with drops.

### 9.2 Cosmetics
- Hairstyles, eye colors, other appearance options. (Dyes deferred.)

### 9.3 Apothecary
- **One-use potions** applied to the next quest/boss: better success chance, better drop chance, etc. No permanent effects.

### 9.4 Housing
- Bigger/nicer houses and furniture/decorations. Cosmetic only.

### 9.5 Tavern: weekly side quest
- Each week the tavern offers a bounty on **one randomly chosen habit** (never the boss habit).
- The user **accepts** it at the tavern. **One reroll per week.**
- Each day that habit is completed → **bonus gold**.
- Missed days just forfeit that day's bonus. Small extra bonus for ~5 of 7 days.

## 10. Message Board

- **Guild Master letters:** a recurring NPC mentor with personality. Writes after quests (success/failure), boss wins, level-ups, new familiars, and weekly recaps. Encouraging, never scolding — including after failures and quiet weeks.
- **Quest log:** history of quests, outcomes, rewards — written as the Guild Master's records.
- v1 letters are template-based (written lines with variables). Builder's call on how many variants.

## 11. Open items left to the builder

- Habit schedule types (daily only vs. specific weekdays vs. X per week). Suggest: daily + specific weekdays in v1. "Today's habits" = those scheduled today.
- All numeric tuning: EXP curve, gold amounts, prices, success-chance formula, level thresholds per boss tier, stat effect sizes, drop rates.
- Quest and boss content (names, flavour, art).
- Exact gear slots, rarity tiers and visual effects per rarity.

## 12. Approach & tech

**Chosen: React Native with Expo (TypeScript).** iOS + Android from one codebase, fast on-device iteration with Expo Go, solid local notifications, and a stack Claude Code works well in.

Considered:
- **Native iOS (SwiftUI + SpriteKit):** best iPhone feel and animation, but iPhone-only, needs a Mac, slower iteration.
- **Web app / PWA first:** fastest prototyping, but unreliable notifications (critical for the quest timer) and a rewrite later.
- Game engines (Godot/Unity) dropped: most of the app is lists, forms and menus.

Technical decisions:
- **Local-only data** (on-device storage, e.g. SQLite). No backend in v1.
- **Time-based logic uses timestamps**, not running timers: a quest stores start time and computed end time, so it's correct after the app is closed.
- **Local push notification** scheduled for quest completion, rescheduled when habits shorten it.
- **Layered 2D sprites** for character + gear (paper-doll), so gear changes appearance without per-combination art.
- **Placeholder art first.** Art volume (character layers, gear, familiars, bosses, houses, furniture, fight animation) is the biggest cost. Build the loop with simple placeholders and swap art in later.

### 12.1 Building with a public release in mind *(designer's call)*
Do now (cheap, and painful to add later):
- **Versioned save data with migrations** from day one, so updates never wipe friends' progress.
- **Export / import save** (a file the user can save and restore). This is the only protection against a lost phone while there's no cloud.
- **All game content and tuning as data** (quests, bosses, gear, shop items, letters, numbers in JSON/TS config), not hard-coded, so balancing doesn't need code changes.
- Basic accessibility habits: readable text sizes and labels on buttons.

Defer until a public release: onboarding/tutorial polish, store listings and privacy policy, crash reporting, cloud backup/accounts, analytics.

**Money:** v1 has no real-money purchases. Gold is earned only by playing. If monetization is ever added, it should be cosmetic-only and must not touch the premium Armory slot or potions. That would break the gentle, no-pressure tone.

### 12.2 Art replacement system *(designer's call)*
Goal: the creator can replace any placeholder by dropping in a file. No code changes.
- **Frame-based sprite sheets**, not skeletal rigs. Simpler to draw for a solo artist, and works well with the Finch-like style.
- **Paper-doll layers:** body, eyes, hair, head gear, body gear, hand/feet gear, weapon, plus a glow/effect layer for rare gear. Every layer for a given animation uses the **same canvas size, anchor point and frame count**, so any combination lines up.
- Animations in v1: **idle** and **fight**. Familiars: idle and follow. Bosses: one portrait/idle.
- **One art folder with a naming convention** (e.g. `art/gear/body/iron_plate/idle.png`) plus a single **art manifest** file listing each asset's id, file, frame count and fps. Content data refers to art by id only.
- **Placeholders follow the exact same format**: generated simple shapes/colors at the real canvas sizes, with the real frame counts. Replacing one means overwriting a file.
- An **art spec doc** (canvas sizes, anchors, frame counts, layer order, naming) is written early, so the creator can start drawing in parallel.
- A hidden **art preview screen** in the app to view any character/gear combination and animation, for checking new art.

## 13. Regions *(agreed direction, still being designed; replaces the random daily board and the F–S boss tiers once built)*

**Agreed with the creator:**
- **The world is made of regions.** Each region needs a minimum **power rating** to enter. **Event regions** can appear alongside event bosses.
- **A region has its own quests.** While your hero is in a region, the quest board offers that region's **three quests** and you pick one per day (the daily loop in §5 is unchanged).
- **Required power is fixed per quest.** So as your power grows, your odds on each quest rise through the 20% → 60% → 100% steps. Growing stronger is visible progress.
- **First completion gives a memento.** The first time you complete each quest, you get a special item that goes into that region's **scrapbook** as a keepsake.
- **Moving on:** you can travel to the next region once your power meets its requirement **and** you've completed each of the current region's quests at least once.
- **Region complete:** a region is *complete* when all its quests are completed **and its region boss is defeated**.
- **Bosses belong to regions** instead of F–S tiers. Bosses get a **difficulty picker: Normal, Hard, Extreme**. Any boss can be attempted from any region, wherever your hero currently is.

**Still open** (to settle before planning):
- Whether a region's three quests are the same every day or rotate from a larger pool.
- Which bosses are available. Every boss in the game, or only those of regions you've reached?
- *(settled)* Hard and Extreme always need **6 boss tokens**, the same as Normal. Proposed effects: your effective power is −30 (Hard) or −60 (Extreme); rewards are ×1.75 or ×3; the familiar drop chance is ×2 or ×4.
- How many bosses each region has, and whether you can travel back to earlier regions.
