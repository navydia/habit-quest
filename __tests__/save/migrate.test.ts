import { CURRENT_VERSION, migrate, newSave } from '@/src/save/migrate';

test('a fresh save starts at level 1 with nothing in it', () => {
  const s = newSave();
  expect(s.version).toBe(CURRENT_VERSION);
  expect(s.player).toMatchObject({ level: 1, exp: 0, gold: 0, unspentSp: 0, spentSp: 0 });
  expect(s.habits).toEqual([]);
  expect(s.activeRun).toBeNull();
});

test('no stored save gives a fresh save, not marked recovered', () => {
  expect(migrate(undefined)).toEqual({ save: newSave(), recovered: false });
  expect(migrate(null)).toEqual({ save: newSave(), recovered: false });
});

test('a valid v1 save survives a JSON round trip unchanged', () => {
  const s = { ...newSave(), player: { ...newSave().player, level: 4, exp: 12, gold: 300, unspentSp: 3 } };
  expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual({ save: s, recovered: false });
});

describe('corrupt or unknown save data never crashes', () => {
  test.each([
    ['a string', 'garbage'],
    ['an unknown version', { version: 99 }],
    ['a v1 save missing fields', { version: 1 }],
    ['an array', []],
  ])('%s → fresh save, recovered', (_label, raw) => {
    const r = migrate(raw);
    expect(r.save).toEqual(newSave());
    expect(r.recovered).toBe(true);
  });
});

test('a version 1 save mid-quest upgrades all the way to the current version without losing anything', () => {
  const run = { offer: { id: 'o', templateId: 't', name: 'n', flavour: 'f', difficulty: 'easy', requiredPower: 90, rewardExp: 40, rewardGold: 20 }, dayKey: '2026-11-27', startedAt: '2026-11-27T09:00:00.000Z', successChance: 1 };
  const v1 = {
    version: 1,
    player: { level: 3, exp: 50, gold: 120, unspentSp: 6 },
    habits: [{ id: 'h', name: 'Read', schedule: { kind: 'daily' }, createdAt: '2026-11-01T00:00:00.000Z', archived: false }],
    completions: [],
    board: null,
    activeRun: run,
    pendingResult: null,
    lastQuestStartedDayKey: '2026-11-27',
    questLog: [],
  };
  const { save, recovered } = migrate(v1);
  expect(recovered).toBe(false);
  expect(save.version).toBe(3);
  expect(save.activeRun).toEqual(run);
  expect(save.habits).toHaveLength(1);
  expect(save.player).toMatchObject({ level: 3, exp: 50, gold: 120, unspentSp: 6, spentSp: 0, title: 'Vanguard' });
  expect(save.player.stats).toEqual({ power: 0, defense: 0, luck: 0, speed: 0 });
  expect(Object.keys(save.player.equipped).sort()).toEqual(['body', 'weapon']);
});

test('a v2 save missing its equipment is treated as corrupt, not crashed on', () => {
  const s: any = newSave();
  delete s.player.equipped;
  expect(migrate(s).recovered).toBe(true);
});

test('a v2 save mid-adventure upgrades to v3 with a starting world', () => {
  const v2: any = { ...newSave() };
  v2.version = 2;
  delete v2.world;
  delete v2.boss;
  delete v2.familiars;
  v2.activeRun = { offer: { id: 'o', templateId: 'slime-patrol', name: 'n', flavour: 'f', difficulty: 'easy', requiredPower: 90, rewardExp: 40, rewardGold: 20 }, dayKey: '2026-11-27', startedAt: '2026-11-27T09:00:00.000Z', successChance: 1 };
  const { save, recovered } = migrate(v2);
  expect(recovered).toBe(false);
  expect(save.version).toBe(3);
  expect(save.activeRun?.offer.id).toBe('o');
  expect(save.world.currentRegion).toBe('thornwick-meadows');
  expect(save.boss).toEqual({ habitId: null, tokenEpoch: null });
  expect(save.familiars).toEqual({ owned: [], active: null });
});
