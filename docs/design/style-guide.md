# Habit Quest — Style Guide

*Applies to every screen and every placeholder. Your own art replaces placeholders later; the UI around it stays.*

## 1. Direction: "Storybook adventurer at dusk"

**Finch's warmth, a few years older.** Finch uses bright, saturated pastels, round sans type, chunky tactile buttons, and a character in a scene filling the top of Home ([Finch home](https://mobbin.com/screens/e7f40efd-01a8-4f03-828e-31db0c35dbc2), [goal sheet](https://mobbin.com/screens/fee8ee54-08e3-4e45-86ba-2a3792cda533)). We keep the structure and the softness, and shift the tone:

| Finch | Habit Quest |
|---|---|
| Candy brights (purple, lime, sky blue) | **Muted, earthy, dusky**: moss, slate, parchment, ember, with gold kept for rewards |
| Round sans everywhere | **Soft serif headings** (storybook, a bit serious) + clean rounded sans body |
| Big emoji / stickers | Small **line icons**; emoji only inside user habit names |
| "Woohoo!" copy | **Warm, wry, grown-up** copy (a guild master, not a cheerleader) |
| Bright day scenes | **Golden-hour / dusk scenes**, lamplight, deep greens |

**What else the research showed:**
- **Pet and companion apps** ([Tolan](https://mobbin.com/screens/1de99ca0-0ce5-49c6-8bef-c1cf6a60fb47), [BitePal](https://mobbin.com/screens/eb74890f-44ab-41bd-8933-7beebe1036c3), [Abode](https://mobbin.com/screens/d450f05c-bebb-4852-a443-c8f62468ff03)) put the character in a full-bleed scene over the top ~45–55% of the screen. A rounded sheet holds the controls below it.
- **Equipment and inventory screens** ([Tolan](https://mobbin.com/screens/710cc65a-45f8-4624-b343-775b588bf48b), [BitePal](https://mobbin.com/screens/b4bd8e47-e8a0-45ac-8170-61ac7cee286e)) show a large character on top and a 3-column item grid with category icon tabs below. [Life Reset](https://mobbin.com/screens/28db14a2-e6a1-4f49-a304-a048fa1880b4) shows what *not* to do: a dark, dense stat dashboard reads as a spreadsheet.
- **Reward reveals** ([Duolingo](https://mobbin.com/screens/2df438b2-5c11-49f3-af79-1e4de036b85d), [Kit](https://mobbin.com/screens/cb4c7a73-15dc-4af8-a5ef-a51fdbf1a12f), [(Not Boring) Weather](https://mobbin.com/screens/62b90e1a-17bd-4822-9a32-672edab786e0)) use one big item, a rarity label above it, a single short line of copy, and one primary button.
- **2026 trends** favor cleaner, quieter interfaces, UI that feels part of the game world, and touch, sound and motion designed together. Cozy games are popular because they're low-stress.

## 2. Platform guidelines we follow

- **iOS (Liquid Glass, iOS 26/27):** use the **system tab bar** (Expo Router *native tabs*), so iOS draws its own Liquid Glass bar and honors the user's clear/tinted setting. Glass is for navigation only. Content cards are solid, never glass. Don't stack custom blur on top of the system glass.
- **Android (Material 3 Expressive):** the native tabs render a Material bottom nav. Generous corner radii and springy motion already fit Expressive.
- **Accessibility (both):**
  - Touch targets **≥ 44×44 pt**.
  - Text contrast **≥ 4.5:1** (3:1 for large text and icons).
  - Respect **Dynamic Type / font scale**, capped at 1.5× only inside fixed game HUD elements.
  - Every icon-only button has an `accessibilityLabel`.
  - **Reduce Motion** stops idle bobbing, swaps big animations for fades, and keeps the fight animation as a simple 2-frame loop.
  - Color is never the only signal: rarity also has a text label, and checked habits have a check mark.
- **Haptics:** light impact when checking a habit; success notification when the gauge fills and on Collect. Never haptics on failure.
- **Light and dark mode:** follow the system. The Home scene keeps its own palette in both modes (it's a painting); the UI chrome switches.

## 3. Color tokens

Light / Dark. All text pairings meet 4.5:1.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F3EDE2` parchment | `#16191D` | Screen background |
| `surface` | `#FFFBF4` | `#22272D` | Cards, sheets |
| `surfaceSunk` | `#E8E0D1` | `#1B1F24` | Wells, unfilled bar |
| `text` | `#2A2623` | `#EEE8DD` | Primary text |
| `textMuted` | `#6B6259` | `#A39B8F` | Secondary text |
| `line` | `#DDD3C2` | `#343A42` | Dividers, card borders |
| `primary` | `#3F6B4F` moss | `#7FB08E` | Primary buttons, checks, gauge fill |
| `onPrimary` | `#FFFFFF` | `#0F1A13` | Text on primary |
| `primaryLip` | `#2C4D38` | `#5C8A6B` | Tactile button "lip" (bottom edge) |
| `accent` | `#C9892B` gold | `#E3B25A` | Gold, rewards, "ready" states |
| `ember` | `#B5543A` | `#E08467` | Boss, danger-lite (never used for missed habits) |
| `info` | `#4D6A8A` slate | `#8FAACB` | Questing state, timers |

**Scene palette (Home background):** sky dusk gradient `#E9B98A → #8E7A9E → #3E4A63`, far hills `#4F6A5A`, near ground `#3B5546`, lamplight `#F6D18B`.

**Rarity** (each also has a text label):
- Common `#8C877F`
- Uncommon `#5E9A6B`
- Rare `#4F7FB5`
- Epic `#8A5FB0`
- Legendary `#D49A2A` + glow

## 4. Type

- **Headings:** **Nunito Sans ExtraBold (800)**. The creator swapped the storybook serif for a friendly sans-serif (Plan 6).
- **Body/UI:** **Nunito Sans** (Regular 400 / SemiBold 600 / Bold 700). It's rounded and friendly without looking childish.
- Numbers in HUD (gold, timers): Nunito Sans Bold with tabular figures.

| Style | Font | Size/Line |
|---|---|---|
| `display` | Nunito Sans 800 | 32/38 |
| `title` | Nunito Sans 800 | 24/30 |
| `heading` | Nunito Sans 800 | 19/24 |
| `body` | Nunito Sans 400 | 16/24 (1.5 line height) |
| `bodyStrong` | Nunito Sans 700 | 16/24 |
| `label` | Nunito Sans 600 | 13/18, sentence case |
| `caption` | Nunito Sans 400 | 13/18 |

Labels use sentence case, not all caps (easier to read).

## 5. Shape, space, depth

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Screen side padding is 20.
- Radii: card **20**, sheet **28** (top corners), button **16**, chip **999**.
- **Tactile buttons** (from Finch): the primary button has a 4-pt darker "lip" below it. On press it moves down 3 pt and the lip shrinks. Secondary buttons are `surface` with a `line` border and a lip.
- Shadows: one soft shadow only (`#000` at 8% opacity, y 4, blur 12) on cards that float over the scene. Cards on the parchment background use a 1-pt `line` border, no shadow.

## 6. Motion

- Springs, not linear easing: damping ~15, stiffness ~180 for presses; gentler for sheets.
- Hero idle: 2.4 s breathing bob (±3 pt), and a glance left or right every 4–7 s at random.
- Questing: a swing loop every 0.9 s; slimes hop in, squash, and *poof* every ~3 s.
- Gauge fill animates over 400 ms. When full, it gets a single gold shimmer pass and a "ready" pulse on the Choose-a-quest button.
- Reward reveal: the item scales in from 0.6 with a slight overshoot, then rays rotate slowly behind it.

## 7. Placeholder art rules

Placeholders are drawn in code (SVG) **in the final style**, so the app already looks like itself.
- Hero: a small **chibi humanoid**: big round head with hair, dot eyes with a white highlight, small blush, tunic with belt, arms, legs and boots, no outlines (like Finch). A **cloak and scarf** make it read "adventurer". Its separate parts (head, hair, torso, arms, legs) preview the layers of the Plan 2 paper doll.
- The sword is a simple rounded blade with a hilt. The slime is a teal-moss blob with dot eyes.
- Scenes are flat layered shapes in the scene palette.
- Every placeholder uses the same canvas sizes and anchor points the real art will use (Plan 2 art spec), so swapping in final art doesn't change any layout.

## 8. Voice

- **The Guild Master voice:** dry, warm, proud of you, never gushing. "Back before supper, and with 64 gold. Not bad, adventurer."
- **Failure:** "The slimes had numbers today. You still came back with 16 gold."
- Never mention missed habits. No exclamation-mark spam (at most one per screen).
- Buttons are verbs: "Set out", "Collect", "Add habit".

## 9. UI rules for every screen

These are distilled from six UI-guideline sources and chosen for this app: Adham Dannaway's *UI design tips*, Taras Bakusevych's *58 rules for stunning UI* (UX Collective), Emergen's *Modern UI/UX principles*, Webflow's *Modern UI design*, Erik Kennedy's *7 rules for gorgeous UI*, and Figma's *UI design principles*. Every new screen follows them.

**Layout and hierarchy**
1. **One focal point, one primary action per screen.** On Home that's the hero, then the quest button. Hierarchy comes from size, weight, contrast and space, in that order. Run the "squint test": blurred, the most important thing should still stand out.
2. **Double the whitespace you think you need.** Group related items by proximity first, and only use cards or containers when proximity isn't enough. Use the spacing scale (4/8/12/16/20/24/32/40) only, never one-off values.
3. **Keep primary actions in the lower half of the screen**, so they're reachable one-handed. Keep anything destructive (deleting a habit, resetting boss tokens) away from primary buttons, and always confirm it.
4. **Reveal complexity gradually.** Show what's needed now and put the rest one tap away (sheets, "show more"). Break multi-step tasks into small steps with visible progress.
5. **Use familiar patterns.** Native tab bar, bottom sheets, standard back gestures. Novelty belongs in the game world (scenes, characters, rewards), not in how navigation works.

**Color and light**
6. **Light comes from above.** Highlights go on top edges and shadows below: the tactile button lip, one soft drop shadow on floating cards. Never put a shadow above an element.
7. **Get it working in grays first, then add color with purpose.** Aim for a 60-30-10 balance: about 60% parchment and surface, 30% moss and slate UI, and 10% gold. **Gold means reward or the main call to action, nowhere else.**
8. **Status colors are fixed:** moss for success and done, slate for in progress and questing, gold for rewards and ready, ember for bosses and caution. Never use red to scold a missed habit.
9. **Contrast:** at least 4.5:1 for text and 3:1 for icons and large text, checked by the contrast test. **Color is never the only signal.** Pair it with text, an icon or a check mark.

**Type and copy**
10. **One family:** Nunito Sans (ExtraBold for headings). Use regular and bold weights, and sentence case (no all-caps labels). Body text has a line height of about 1.5 and is left-aligned; center only short lines.
11. **Keep text short and verb-led** ("Set out", "Collect", "Read quest log"). Use the Guild Master voice (§8) for anything narrative.

**Feedback and states**
12. **Every action gets immediate feedback:** a pressed state, plus haptics where §2 calls for them, a visible result, and a success moment for rewards. If anything takes longer than about 1 second, show a loading state.
13. **Every list has an empty state** that says what to do next. Every error says what happened and how to fix it, warmly and without blame.
14. **Make progress visible:** gauges, countdowns, region progress, scrapbook completion. Use variable rewards (drops, rare items) and storytelling (quest log, letters) to give delight. Never use pressure tactics.

**Motion and access**
15. **Motion is short (200–300 ms for UI) and purposeful.** Loops are reserved for the game world. Respect Reduce Motion.
16. **Touch targets are at least 44×44 pt**, and every icon-only control has a label for screen readers.
17. **Text must stay usable at large system font sizes.** Nothing gets clipped or overlaps at 200%.
17a. **Inputs always stay above the keyboard.** Any screen or sheet with a text field wraps its content in `KeyboardAvoidingView` with `behavior="padding"` on both iOS and Android (Expo apps are edge-to-edge, so Android no longer resizes for the keyboard). The field being typed in and its submit button must stay visible. Check it on a real phone. (The kit `Sheet` already does this.)

**Consistency**
18. **The design system is the single source of truth.** Screens use only tokens and kit components. The same component looks and behaves the same everywhere. New screen types (shop, scrapbook, region map) get a reusable template before a second one is built.

## 10. Home look (Plans 5–6, creator decisions)
- **Home page:** sits on `home.bg` (deep warm dusk). Text there uses `home.text` / `home.muted`.
- **Habit cards:** tactile, like buttons: a darker lip below, a light top highlight, and a soft shadow.
- **Secondary actions on dark pages** use the **outline** button.
- **Adventure gauge:** a translucent panel. The count sits inside a tall bar, with boss tokens as 😈 icons below it (faded when not yet earned) and no token text.
- **Spacing:** generous gaps between habit cards and before group headers.
- **New screens** (Character, Shop, Log) reuse these pieces: tactile cards, the coloured blobs, the outline buttons and the sans-serif headings.
