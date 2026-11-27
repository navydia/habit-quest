# Habit Quest — Plan 4: Habit Properties, Completion History, Separate Boss Fights

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** These creator requests, in one change:
1. Completing a habit **removes it from today's list**. A ~6-second **Undo** popup catches accidents.
2. Completed habits live in a **History** menu. You can **remove entries from history**, but that never puts a habit back on Home.
3. **Boss fights are their own trip**:
   - When the gauge is full and you have 6 tokens, "Choose an adventure" becomes **"Boss fight"**.
   - A boss fight **replaces** the day's adventure (one or the other per day).
   - Home shows the hero **swinging at a big boss**.
4. Habits get **emoji, life area, time of day and a repeat option**. Today's list can be **grouped by time of day or life area**.

**Spec:** `docs/superpowers/specs/2026-11-27-habit-quest-design.md`. This plan amends §4, §5.6 and §6.2 (recorded in a new spec §14). **Style:** style guide §9.

## Decisions (builder's calls)
- **Undo:** within ~6 s it reverses the completion with the existing §5.6 rule. Rewards that were already used (a started trip, spent tokens) stay used.
- **History removal:** sets `hidden: true` on the completion. It still counts for the day, so it can't come back to Home and can't be used to undo rewards.
- **Yesterday backfill** (§5.6) stays. Logged habits disappear from that list too.
- **Boss trip:**
  - Same 8 h timer, habit cuts and Speed as an adventure.
  - Uses `run.kind = 'boss'` with a synthetic offer, so the timer, notification and Skip code are shared.
  - It doesn't clear adventures or give mementos.
  - A boss loss is still free: your 6 tokens come back.
- **Boss sheet:** pick a boss and a difficulty, with a small **"Go adventuring instead"** link that keeps your tokens.
- **Boss scene:** a large placeholder boss (an SVG silhouette tinted per boss) on the meadow, with the hero in the fight animation.
- **Repeat:** `daily` | `weekdays` (chosen days) | `interval` (every N days, counted from the creation day).
- **Life areas:** Health, Mind, Work, Home, Social, Learning, Fun, Other.
- **Time of day:** Morning, Afternoon, Evening, Anytime. Each habit has one.
- **Emoji:** a quick-pick grid of 24 plus a typed-in field. The default is ✨.
- **Grouping:** a toggle above the list (Time of day / Life area), saved in `settings.groupBy`. Time-of-day groups appear in day order.
- **Editing:** a "⋯" button on each row opens the habit sheet in edit mode, which includes **Archive habit**.
- **Save v4** adds the habit fields, `completion.hidden` and `settings`.

## Review Focus
1. Undo after the completion already started a trip leaves the trip running (§5.6 "already used").
2. Removing a history entry for the boss habit doesn't reduce tokens or put the habit back on Home.
3. An every-N-days habit created on a different day is scheduled on the right days.
4. A day with no adventure board and 6 tokens: Boss fight still works, and only one trip runs per day.
5. A v3 save mid-trip, with or without a boss, migrates without loss.
