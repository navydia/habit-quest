import { ART } from '@/src/art/manifest';
import { heroLayers, LAYER_ORDER } from '@/src/art/layers';
import { GEAR } from '@/src/content/gear';
import { newSave } from '@/src/save/migrate';
import type { Player } from '@/src/game/types';

const withGear = (...gearIds: string[]): Player => {
  const p = newSave().player;
  const inventory = gearIds.map((gearId) => ({ uid: gearId, gearId, obtainedAt: '' }));
  const equipped: Player['equipped'] = {};
  for (const id of gearIds) equipped[GEAR.find((g) => g.id === id)!.slot] = id;
  return { ...p, inventory, equipped };
};

test('layers come out in back-to-front order', () => {
  const names = heroLayers(withGear('iron-sword', 'leather-cap', 'chainmail', 'soft-boots', 'travel-cloak'), 'idle').map((l) => l.layer);
  const sorted = [...names].sort((a, b) => LAYER_ORDER.indexOf(a) - LAYER_ORDER.indexOf(b));
  expect(names).toEqual(sorted);
});

test('the bare hero has the five base layers', () => {
  expect(heroLayers(withGear(), 'idle').map((l) => l.layer)).toEqual(['legs', 'bodyBase', 'head', 'face', 'hair']);
});

test('equipped gear is drawn on its slot layer', () => {
  const layers = heroLayers(withGear('leather-cap', 'hunting-bow'), 'idle');
  expect(layers.find((l) => l.layer === 'headGear')?.artId).toBe('gear.leather-cap');
  expect(layers.find((l) => l.layer === 'weapon')?.artId).toBe('gear.hunting-bow');
});

test('rare or better gear adds an aura in the colour of the best rarity', () => {
  expect(heroLayers(withGear('iron-sword'), 'idle').some((l) => l.layer === 'aura')).toBe(false);
  expect(heroLayers(withGear('iron-helm', 'moonlit-staff'), 'idle')[0]).toMatchObject({ layer: 'aura', artId: 'fx.aura.epic' });
});

test('layers without a fight animation fall back to idle', () => {
  const fight = heroLayers(withGear('wooden-sword'), 'fight');
  expect(fight.find((l) => l.layer === 'weapon')?.asset.frames).toBeGreaterThan(1);
  expect(fight.find((l) => l.layer === 'head')?.asset).toBe(ART['base.head'].idle);
});

test('items with no art are skipped instead of crashing', () => {
  const p = withGear();
  const broken = { ...p, inventory: [{ uid: 'x', gearId: 'removed-item', obtainedAt: '' }], equipped: { head: 'x' } };
  expect(heroLayers(broken, 'idle').map((l) => l.layer)).not.toContain('headGear');
});

test('every catalog item has idle art; weapons also have a fight animation', () => {
  for (const g of GEAR) {
    expect([g.id, !!ART[g.art]?.idle]).toEqual([g.id, true]);
    if (g.slot === 'weapon') expect([g.id, (ART[g.art]?.fight?.frames ?? 0) > 1]).toEqual([g.id, true]);
  }
});
