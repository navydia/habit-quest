import { GEAR, RARITY_BUDGET } from '@/src/content/gear';
import { classTitle } from '@/src/game/classTitle';
import { newSave } from '@/src/save/migrate';
import type { Player } from '@/src/game/types';

test('every item spends exactly its rarity stat budget and has art', () => {
  for (const g of GEAR) {
    const sum = Object.values(g.stats).reduce((a, b) => a + (b ?? 0), 0);
    expect([g.id, sum]).toEqual([g.id, RARITY_BUDGET[g.rarity]]);
    expect(g.art).toBeTruthy();
  }
});

test('the catalog covers every slot, weapon type and rarity', () => {
  for (const slot of ['weapon', 'head', 'body', 'feet', 'accessory']) expect(GEAR.filter((g) => g.slot === slot).length).toBeGreaterThanOrEqual(3);
  for (const t of ['sword', 'bow', 'staff']) expect(GEAR.some((g) => g.weaponType === t)).toBe(true);
  for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary']) expect(GEAR.some((g) => g.rarity === r)).toBe(true);
  expect(new Set(GEAR.map((g) => g.id)).size).toBe(GEAR.length);
});

function withWeapon(gearId: string | null, stats: Partial<Player['stats']>, title = 'Wanderer'): Player {
  const base = newSave().player;
  return {
    ...base,
    title,
    stats: { power: 0, defense: 0, luck: 0, speed: 0, ...stats },
    inventory: gearId ? [{ uid: 'w', gearId, obtainedAt: '' }] : [],
    equipped: gearId ? { weapon: 'w' } : {},
  };
}

test('sword + highest speed is Quick Blade', () => {
  expect(classTitle(withWeapon('wooden-sword', { speed: 3, power: 1 }))).toBe('Quick Blade');
});

test('bow + highest power is Longshot', () => {
  expect(classTitle(withWeapon('hunting-bow', { power: 3 }))).toBe('Longshot');
});

test('a tie keeps the current title', () => {
  expect(classTitle(withWeapon('wooden-sword', { power: 1, luck: 2 }, 'Fortune\'s Edge'))).toBe('Fortune\'s Edge'); // sword adds +1 power → 2 vs 2
});

test('no weapon is Wanderer', () => {
  expect(classTitle(withWeapon(null, { power: 5 }))).toBe('Wanderer');
});
