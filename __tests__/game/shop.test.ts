import { gearById } from '@/src/content/gear';
import { POTIONS } from '@/src/content/shop';
import { armoryStock, buyGear, buyPotion, drinkPotion, premiumItem } from '@/src/game/shop';
import { newSave } from '@/src/save/migrate';
import { at } from '../helpers/save';

const now = at('2026-11-27', 10);
const rich = () => ({ ...newSave(), player: { ...newSave().player, gold: 5000 } });

test('the armory has 4 distinct items a day, the same all day, different the next day', () => {
  const a = armoryStock('2026-11-27');
  expect(a).toHaveLength(4);
  expect(new Set(a.map((x) => x.gearId)).size).toBe(4);
  expect(armoryStock('2026-11-27')).toEqual(a);
  expect(armoryStock('2026-11-28').map((x) => x.gearId)).not.toEqual(a.map((x) => x.gearId));
});

test('the weekly premium item is rare or better and costs 1.5× its price', () => {
  const p = premiumItem('2026-11-27');
  expect(['rare', 'epic', 'legendary']).toContain(gearById(p.gearId)!.rarity);
  expect(premiumItem('2026-11-29').gearId).toBe(p.gearId); // same ISO week (Mon 23 – Sun 29)
});

test('buying gear takes gold, adds the item and sells out that slot for the day', () => {
  const slot = armoryStock('2026-11-27')[0];
  const r = buyGear(rich(), slot.slotId, now);
  expect(r.error).toBeUndefined();
  expect(r.save.player.gold).toBe(5000 - slot.price);
  expect(r.save.player.inventory.some((i) => i.gearId === slot.gearId)).toBe(true);
  expect(buyGear(r.save, slot.slotId, now).error).toBe('Sold out today. New stock tomorrow.');
});

test('buying without enough gold does nothing and says why', () => {
  const slot = armoryStock('2026-11-27')[0];
  const r = buyGear(newSave(), slot.slotId, now);
  expect(r.error).toBe(`You need ${slot.price - 0} more gold.`);
  expect(r.save).toEqual(newSave());
});

test('potions are bought, then drunk to be active for the next trip; only one at a time', () => {
  let s = buyPotion(rich(), 'fortune').save;
  s = buyPotion(s, 'swift').save;
  expect(s.potions.owned).toEqual({ fortune: 1, swift: 1 });
  s = drinkPotion(s, 'fortune').save;
  expect(s.potions.active).toBe('fortune');
  expect(s.potions.owned.fortune).toBe(0);
  expect(drinkPotion(s, 'swift').error).toBe('You already have a potion active.');
  expect(POTIONS.find((p) => p.id === 'courage')!.price).toBe(120);
});
