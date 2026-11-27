import { seededRng } from '@/src/game/rng';

test('same seed gives the same sequence', () => {
  const a = seededRng('a');
  const b = seededRng('a');
  expect([a(), a(), a()]).toEqual([b(), b(), b()]);
});

test('different seeds give different sequences', () => {
  expect(seededRng('a')()).not.toBe(seededRng('b')());
});

test('values lie in [0, 1)', () => {
  const r = seededRng('range');
  for (let i = 0; i < 1000; i++) {
    const v = r();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});
