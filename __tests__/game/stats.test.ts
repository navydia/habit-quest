import { allocateSp, basePower, gearStats, powerOf, respec, speedFactor, totalStats } from '@/src/game/stats';
import { newSave } from '@/src/save/migrate';
import type { Player } from '@/src/game/types';

const fresh = (): Player => ({ ...newSave().player, inventory: [], equipped: {} });

test('base power is 100 at level 1 and +15 per level', () => {
  expect(basePower(1)).toBe(100);
  expect(basePower(3)).toBe(130);
});

test('spending SP raises a stat; nothing happens without SP', () => {
  const p = { ...fresh(), unspentSp: 1 };
  const a = allocateSp(p, 'power');
  expect(a.stats.power).toBe(1);
  expect(a.unspentSp).toBe(0);
  expect(a.spentSp).toBe(1);
  expect(allocateSp(a, 'luck')).toBe(a);
});

test('respec returns exactly the SP spent', () => {
  let p: Player = { ...fresh(), unspentSp: 4 };
  for (const s of ['power', 'luck', 'luck'] as const) p = allocateSp(p, s);
  const r = respec(p);
  expect(r.stats).toEqual({ power: 0, defense: 0, luck: 0, speed: 0 });
  expect(r.unspentSp).toBe(4);
  expect(r.spentSp).toBe(0);
});

test('power counts base, Power points and gear', () => {
  const p: Player = {
    ...fresh(),
    stats: { power: 2, defense: 0, luck: 0, speed: 0 },
    inventory: [{ uid: 'u1', gearId: 'iron-sword', obtainedAt: '' }],
    equipped: { weapon: 'u1' },
  };
  expect(gearStats(p).power).toBe(2); // iron sword: uncommon, +2 power
  expect(totalStats(p).power).toBe(4);
  expect(powerOf(p)).toBe(100 + 3 * 4);
});

test('equipped items missing from the catalog are skipped', () => {
  const p: Player = { ...fresh(), inventory: [{ uid: 'x', gearId: 'removed-item', obtainedAt: '' }], equipped: { head: 'x' } };
  expect(powerOf(p)).toBe(100);
});

test('speed shortens quests by 1.5% a point, at most 20%', () => {
  const p = (speed: number): Player => ({ ...fresh(), stats: { power: 0, defense: 0, luck: 0, speed } });
  expect(speedFactor(p(0))).toBe(1);
  expect(speedFactor(p(10))).toBeCloseTo(0.85);
  expect(speedFactor(p(50))).toBeCloseTo(0.8);
});

test('a new save starts with a wooden sword and tunic equipped and the Wanderer title worked out', () => {
  const p = newSave().player;
  const ids = p.inventory.map((i) => i.gearId).sort();
  expect(ids).toEqual(['travellers-tunic', 'wooden-sword']);
  expect(Object.keys(p.equipped).sort()).toEqual(['body', 'weapon']);
});
