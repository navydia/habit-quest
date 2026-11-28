# Habit Quest — Plan 5: Home Redesign, Reordering, Boss Preview, Adventure Board

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal (creator requests):**
1. **Finch-like Home and habit sheet**, keeping our own identity:
   - Big scene.
   - Adventure bar with an icon.
   - "N habits left for today" header with a sort control.
   - Section headers with "+".
   - Large rounded white habit cards with an emoji blob, the life area as subtitle, and a big tactile check button.
   - A habit sheet made of rows (Life area, Time of day, Repeat) with Save pinned to the bottom.
2. **Drag to reorder.** Dropping into another time-of-day or life-area section changes that property immediately. A new **Custom** sort shows one ungrouped list in your own order.
3. **Bosses:**
   - A lost fight **loses the tokens**.
   - Each difficulty has a required power: Normal = boss power, Hard = +30, Extreme = +60.
   - **Normal is always 100%.** Hard is 100% if you meet its requirement, otherwise **50%**. Extreme is 100% if you meet it, otherwise **5%**.
   - The boss screen shows a large **boss preview**, with small difficulty buttons under it. The selected one shows the required power and the chance, with colour changing by risk.
4. **Adventure board:** a cork board with the adventures pinned on as notes, each showing required power and chance.
5. **Skip (testing)** becomes two buttons, **Win** and **Lose**, for adventures and bosses.

**Spec:** spec §14 is amended by §15, written in this plan. **Style:** style guide §9 applies (17a: Save is pinned at the bottom, above the keyboard).

## Decisions
- **Order:** `habit.order` (number). Sections sort by order. A cross-section drop sets `timeOfDay` or `lifeArea` and the new order. Custom = one list by order.
- **Drag:** long-press a card (~250 ms) to pick it up, drag it, and release to drop. It's built with React Native's own gesture tools, so it works in Expo Go. A haptic plays on pickup.
  - **Accessibility:** screen readers get "Move up" and "Move down" actions instead, because dragging isn't usable with them.
- **Home background:** a deep warm dusk (`#4A3B3A` light and dark) under the scene, with cream cards. The style-guide palette is kept; only the Home page gets the dark backdrop, the same way Finch tints the whole page with the scene colour.
- **Boss loss:** tokens are gone (spec §6.2 "keep tokens" is reversed). The return screen says so.
- **Skip:** `resolveQuest(..., force)` with forced dice. Win = all rolls 0, Lose = all rolls 0.99. Dev builds only.

## Review Focus
1. Dragging the last card out of a section leaves no empty header behind, and the order stays stable after an app restart.
2. Dropping into the "Anytime" or "Other" section sets that value.
3. Normal is 100% even when your power is far below the boss.
4. A lost boss fight clears its tokens, even if the boss habit was switched during the trip.
5. Custom order survives switching the grouping back and forth.
