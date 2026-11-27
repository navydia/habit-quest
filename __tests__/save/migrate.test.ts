import { CURRENT_VERSION, migrate, newSave } from '@/src/save/migrate';

test('a fresh save starts at level 1 with nothing in it', () => {
  const s = newSave();
  expect(s.version).toBe(CURRENT_VERSION);
  expect(s.player).toEqual({ level: 1, exp: 0, gold: 0, unspentSp: 0 });
  expect(s.habits).toEqual([]);
  expect(s.activeRun).toBeNull();
});

test('no stored save gives a fresh save, not marked recovered', () => {
  expect(migrate(undefined)).toEqual({ save: newSave(), recovered: false });
  expect(migrate(null)).toEqual({ save: newSave(), recovered: false });
});

test('a valid v1 save survives a JSON round trip unchanged', () => {
  const s = { ...newSave(), player: { level: 4, exp: 12, gold: 300, unspentSp: 3 } };
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
