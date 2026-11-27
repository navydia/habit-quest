import { generateBoard, successChance } from '@/src/game/quests';
import { seededRng } from '@/src/game/rng';
import { QUEST_TEMPLATES } from '@/src/content/quests';

const lvl1 = { level: 1, exp: 0, gold: 0, unspentSp: 0 };

describe('successChance (creator rules)', () => {
  test('power meets or exceeds requirement → 100%', () => {
    expect(successChance(100, 100)).toBe(1);
    expect(successChance(150, 100)).toBe(1);
  });
  test('up to 50 points short → 60%', () => {
    expect(successChance(100, 101)).toBe(0.6);
    expect(successChance(100, 150)).toBe(0.6);
  });
  test('more than 50 points short → 5%', () => {
    expect(successChance(100, 151)).toBe(0.05);
  });
});

test('there are at least 12 quest templates with unique ids', () => {
  expect(QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(12);
  expect(new Set(QUEST_TEMPLATES.map((t) => t.id)).size).toBe(QUEST_TEMPLATES.length);
});

describe('generateBoard', () => {
  const board = generateBoard('2026-11-27', lvl1, seededRng('2026-11-27'));
  test('offers one quest of each difficulty with distinct templates', () => {
    expect(board.map((o) => o.difficulty)).toEqual(['easy', 'normal', 'hard']);
    expect(new Set(board.map((o) => o.templateId)).size).toBe(3);
  });
  test('required power falls in each difficulty band', () => {
    const [e, n, h] = board.map((o) => o.requiredPower);
    expect(e).toBeGreaterThanOrEqual(40);
    expect(e).toBeLessThanOrEqual(100);
    expect(n).toBeGreaterThanOrEqual(110);
    expect(n).toBeLessThanOrEqual(150);
    expect(h).toBeGreaterThanOrEqual(135);
    expect(h).toBeLessThanOrEqual(190);
  });
  test('rewards scale with difficulty', () => {
    expect(board.map((o) => o.rewardExp)).toEqual([40, 64, 120]);
    expect(board.map((o) => o.rewardGold)).toEqual([20, 32, 60]);
  });
  test('same seed gives the same board', () => {
    expect(generateBoard('2026-11-27', lvl1, seededRng('2026-11-27'))).toEqual(board);
  });
  test('hard quests are sometimes a 60% gamble and sometimes a 5% long shot', () => {
    const chances = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const hard = generateBoard('d', lvl1, seededRng(`s${i}`))[2];
      chances.add(successChance(100, hard.requiredPower));
    }
    expect(chances).toEqual(new Set([0.6, 0.05]));
  });
});
