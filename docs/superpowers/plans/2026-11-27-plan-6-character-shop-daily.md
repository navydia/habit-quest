# Habit Quest — Plan 6: Character Tab, Shop, Potions, Daily Quests

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal (creator requests):**
1. **Character tab:**
   - A portrait with **6 equipment boxes** around it: weapon, head and body on the left; feet, accessory and **familiar** on the right. Tapping a box shows the item's stats and lets you change it.
   - **Stats with their effects**, for example "+9 power", "+6% drop chance", "−12% adventure time".
   - **Lifetime stats:** adventures completed, habits completed, bosses beaten, regions explored, mementos, gold earned.
   - The active familiar's bonus, and more colour.
2. **Familiar list** moves to the Log tab.
3. **City → Shop tab** (no tavern), with each shop as its own tab:
   - **Armory:** 4 daily items plus 1 weekly premium item (rare or better).
   - **Apothecary:** potions that boost your next trip.
   - **Cosmetics** and **Housing:** "coming soon".
4. **Daily quests:** 3 a day, which change every day. Examples: "Complete an adventure", "Buy an item". They pay gold and are claimed in the Log.

**Style:** keep everything cohesive with Plan 5 (style guide §10): tactile cards, emoji blobs, outline buttons on dark pages, Nunito Sans headings.

## Decisions
- **Armory:**
  - Stock is seeded by the day: 4 distinct items, with rarity weighted like drops.
  - The weekly premium item (rare+) is seeded by the ISO week.
  - Prices: common 60, uncommon 150, rare 350, epic 800, legendary 1800 gold. The premium item costs 1.5× its normal price.
  - Each stock slot can be bought once a day.
- **Potions** (one-use; drinking one makes it active for your **next** adventure or boss fight):
  - Fortune Draught (+10 Luck), 80 gold.
  - Swift Tonic (−15% trip time), 80 gold.
  - Courage Brew (+40 power), 120 gold.
  - Only one can be active at a time. It's used up when a trip starts.
- **Daily quests:**
  - A pool of 7: complete an adventure, complete 3 habits, complete 5 habits, buy an item, drink a potion, equip an item, spend a skill point.
  - 3 are chosen each day, seeded by the day and always different from each other.
  - Rewards are 40 to 80 gold. Progress counts from today's actions only.
- **Lifetime stats** are derived from the save:
  - The quest log gives adventures (completed and attempted), bosses beaten and gold earned.
  - Completions give habits completed.
  - Visited regions give regions explored.
  - Mementos are counted from the scrapbooks.
- **Save v5** adds `shop`, `potions`, `daily` and `stats`.

## Review Focus
1. Buying with too little gold, or a sold-out slot, does nothing and says why.
2. A potion applies to exactly one trip. It doesn't affect a trip that's already running.
3. Daily quests reset at the day boundary, and progress made yesterday doesn't count.
4. Claiming a quest twice pays once.
5. A v4 save migrates without loss.
