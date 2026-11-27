import { GEAR, RARITY_ORDER } from '../content/gear';
import { ARMORY_SLOTS, GEAR_PRICE, PREMIUM_MARKUP, potionById } from '../content/shop';
import { RARITY_WEIGHTS } from './config';
import { dayKey } from './dates';
import { seededRng } from './rng';
import type { DayKey, Rarity, SaveData } from './types';

export interface StockItem {
  slotId: string;
  gearId: string;
  price: number;
}
type Result = { save: SaveData; error?: string };

function pickRarity(rng: () => number, allowed: Rarity[]): Rarity {
  const total = allowed.reduce((a, r) => a + RARITY_WEIGHTS[r], 0);
  let roll = rng() * total;
  for (const r of allowed) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) return r;
  }
  return allowed[allowed.length - 1];
}

/** Four distinct items, the same all day. */
export function armoryStock(key: DayKey): StockItem[] {
  const rng = seededRng(`armory-${key}`);
  const out: StockItem[] = [];
  while (out.length < ARMORY_SLOTS) {
    const rarity = pickRarity(rng, RARITY_ORDER);
    const pool = GEAR.filter((g) => g.rarity === rarity && !out.some((o) => o.gearId === g.id));
    if (pool.length === 0) continue;
    const g = pool[Math.floor(rng() * pool.length)];
    out.push({ slotId: `${key}-${out.length}`, gearId: g.id, price: GEAR_PRICE[g.rarity] });
  }
  return out;
}

/** Monday of the ISO week containing the day. */
function weekOf(key: DayKey): DayKey {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** One rare-or-better item a week, at a premium. */
export function premiumItem(key: DayKey): StockItem {
  const week = weekOf(key);
  const rng = seededRng(`premium-${week}`);
  const rarity = pickRarity(rng, ['rare', 'epic', 'legendary']);
  const pool = GEAR.filter((g) => g.rarity === rarity);
  const g = pool[Math.floor(rng() * pool.length)];
  return { slotId: `premium-${week}`, gearId: g.id, price: Math.round(GEAR_PRICE[g.rarity] * PREMIUM_MARKUP) };
}

function boughtToday(s: SaveData, key: DayKey): string[] {
  return s.shop.dayKey === key ? s.shop.bought : [];
}

export function buyGear(s: SaveData, slotId: string, now: Date): Result {
  const key = dayKey(now);
  const item = [...armoryStock(key), premiumItem(key)].find((x) => x.slotId === slotId);
  if (!item) return { save: s, error: 'That item is no longer for sale.' };
  const bought = boughtToday(s, key);
  // The premium slot is per week, so it stays sold out after buying.
  const premiumSold = slotId.startsWith('premium-') && s.player.inventory.some((i) => i.obtainedAt === slotId);
  if (bought.includes(slotId) || premiumSold) return { save: s, error: 'Sold out today. New stock tomorrow.' };
  if (s.player.gold < item.price) return { save: s, error: `You need ${item.price - s.player.gold} more gold.` };
  return {
    save: {
      ...s,
      shop: { dayKey: key, bought: [...bought, slotId] },
      player: {
        ...s.player,
        gold: s.player.gold - item.price,
        inventory: [...s.player.inventory, { uid: `shop-${slotId}-${now.getTime()}`, gearId: item.gearId, obtainedAt: slotId.startsWith('premium-') ? slotId : now.toISOString() }],
      },
    },
  };
}

export function buyPotion(s: SaveData, id: string): Result {
  const p = potionById(id);
  if (!p) return { save: s, error: 'Unknown potion.' };
  if (s.player.gold < p.price) return { save: s, error: `You need ${p.price - s.player.gold} more gold.` };
  return {
    save: {
      ...s,
      player: { ...s.player, gold: s.player.gold - p.price },
      potions: { ...s.potions, owned: { ...s.potions.owned, [id]: (s.potions.owned[id] ?? 0) + 1 } },
    },
  };
}

export function drinkPotion(s: SaveData, id: string): Result {
  if (s.potions.active) return { save: s, error: 'You already have a potion active.' };
  if ((s.potions.owned[id] ?? 0) < 1) return { save: s, error: 'You have none of those.' };
  return { save: { ...s, potions: { owned: { ...s.potions.owned, [id]: s.potions.owned[id] - 1 }, active: id } } };
}
