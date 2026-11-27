import { addExp, expToNext, powerRating } from '@/src/game/progression';

const p = (level: number, exp: number) => ({ level, exp, gold: 0, unspentSp: 0 });

test('expToNext is 100 x level', () => {
  expect(expToNext(1)).toBe(100);
  expect(expToNext(4)).toBe(400);
});

test('power rating is 100 at level 1 and +15 per level', () => {
  expect(powerRating(1)).toBe(100);
  expect(powerRating(3)).toBe(130);
});

test('adding exp levels up, carries the overflow and grants 3 SP', () => {
  expect(addExp(p(1, 90), 30)).toEqual({ player: { level: 2, exp: 20, gold: 0, unspentSp: 3 }, levelsGained: 1 });
});

test('a big reward can cross two levels', () => {
  const r = addExp(p(1, 0), 100 + 200 + 5);
  expect(r.player.level).toBe(3);
  expect(r.player.exp).toBe(5);
  expect(r.player.unspentSp).toBe(6);
  expect(r.levelsGained).toBe(2);
});

test('no level-up below the threshold', () => {
  expect(addExp(p(1, 0), 99).levelsGained).toBe(0);
});
