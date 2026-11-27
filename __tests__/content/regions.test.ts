import { QUEST_TEMPLATES } from '@/src/content/quests';
import { REGIONS, bossById, regionById } from '@/src/content/regions';

test('every region has an easy, normal and hard adventure from the story pool', () => {
  for (const r of REGIONS) {
    expect(r.adventures.map((a) => a.difficulty)).toEqual(['easy', 'normal', 'hard']);
    for (const a of r.adventures) expect(QUEST_TEMPLATES.some((t) => t.id === a.id)).toBe(true);
    const req = r.adventures.map((a) => a.requiredPower);
    expect([...req].sort((x, y) => x - y)).toEqual(req);
  }
});

test('regions get harder in order and the first has no minimum', () => {
  expect(REGIONS[0].minPower).toBe(0);
  for (let i = 1; i < REGIONS.length; i++) expect(REGIONS[i].minPower).toBeGreaterThan(REGIONS[i - 1].minPower);
});

test('ids are unique across adventures, mementos, bosses and familiars', () => {
  const ids = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
  ids(REGIONS.flatMap((r) => r.adventures.map((a) => a.id)));
  ids(REGIONS.flatMap((r) => r.adventures.map((a) => a.memento.id)));
  ids(REGIONS.map((r) => r.boss.id));
  ids(REGIONS.map((r) => r.boss.familiar.id));
});

test('lookups find regions and bosses, and return undefined for unknown ids', () => {
  expect(regionById(REGIONS[1].id)?.name).toBe(REGIONS[1].name);
  expect(bossById(REGIONS[2].boss.id)?.name).toBe(REGIONS[2].boss.name);
  expect(regionById('nowhere')).toBeUndefined();
});
