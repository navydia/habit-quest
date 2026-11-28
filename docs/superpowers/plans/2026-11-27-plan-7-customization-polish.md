# Habit Quest — Plan 7: Customization, Places, Home Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Each numbered item is a task. Tick it in the ledger when done.

All of these are creator requests, made after testing PR #7 on a phone.

## Tasks
1. **Habit sheet keyboard fix.**
   - The sheet becomes a **full-screen page** with a header bar: **Cancel · New habit · Add** (or **Save** when editing), so the action is always visible.
   - The content scrolls, inside a KeyboardAvoidingView.
   - The name field no longer auto-focuses, so the keyboard doesn't cover the page on open.
   - Rule 17a is satisfied by the header action.
2. **Places.** The world gets a location: `home` or a region.
   - **Home scene:** the cottage, with a wall colour and a floor colour.
   - **Region scenes:** each region has a sky, hills and ground palette.
   - **Home page background** = the place's **floor/ground** colour.
   - **Pull-down area** above the scene = the place's **wall/sky** colour, feathered into the background with a gradient.
   - **Map button** at the top right of Home (map icon). It reads **"Home"** or the region name. The Map sheet gets a **"Go home"** button.
   - Travelling to a region shows that region's scene. Adventures always come from the last region you travelled to (`world.currentRegion`). Being at home is just the view.
3. **Home HUD.**
   - Gold and power are removed.
   - The **level and a small EXP bar** go under the character.
   - The Debug chip is removed. The Debug menu moves into the **Log** (dev builds only) and gains **Skip 1h / 3h / 8h** and **Start new day**, via a dev clock offset: `src/game/clock.ts`, `now()`, used everywhere instead of `new Date()`.
4. **Adventure panel.**
   - Bring back the **"Adventure gauge"** subtitle.
   - Hint text ("Today's adventure is done…") goes **above** the boss tokens.
   - **Boss tokens** become **red round coins with a white dragon-head silhouette** (an SVG drawn in the style of the creator's reference), faded when not yet earned.
5. **Habit list polish.**
   - Less padding inside habit cards.
   - The check button uses the gauge's moss colour, with an **SVG check mark** (rounded stroke, to match the font).
   - The "N left for today" header is smaller, with a **sliders (filter) icon**.
   - Less vertical padding around the header.
6. **Return screens.** Four distinct looks:
   - **Adventure win:** gold rays and a chest.
   - **Adventure loss:** a muted dusk and a lantern.
   - **Boss win:** red and gold, with the boss defeated.
   - **Boss loss:** dark, with the boss looming.
7. **Character identity.**
   - A **name** (default "Adventurer", editable).
   - **Titles** earned by adventuring, bossing, events and achievements, with one chosen to display.
   - The character box shows, top to bottom: **power (large, at the top)**, **name**, the **title (smaller)**, then **class · level**.
   - The **familiar card** is removed from the Character tab (the equipment slot is enough).
8. **Character box is full-bleed** (past the top and sides of the screen). Its background is a **place image**, chosen in Customize → **Change background** (home or any unlocked region).
9. **Customize screen**, opened by a **cog** at the bottom right of the portrait, left of the familiar box. It covers:
   - Name and title.
   - **Skin tone** (5).
   - **Hairstyle** (4).
   - **Hair colour** (6).
   - **Eye colour** (5).
   - **Ear style** (round / pointed).
   - **Gender** (he / she / they), which sets pronouns in text and adds eyelashes for "she".
   - Background.

   The art for these is generated as layered PNG variants in the art format (the art spec is updated).

## Decisions
- **Titles** (id: how it's unlocked):
  - `wanderer`: default.
  - `slime-wrangler`: win 1 adventure.
  - `seasoned`: win 10.
  - `boss-breaker`: beat 1 boss.
  - `dragonslayer`: beat the Cinder Drake.
  - `cartographer`: explore 3 regions.
  - `habit-hero`: complete 100 habits.
  - `collector`: find 6 mementos.
  - `early-bird`: complete 20 morning habits.
  - Event titles can be added to the content later.
- **Save v6** adds:
  - `profile`: `{ name, titleId, pronouns, look: { skin, hairStyle, hairColor, eyes, ears }, background }`
  - `world.atHome`
  - `dev.offsetMs`
