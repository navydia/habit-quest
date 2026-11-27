import { generateBoard, successChance } from '@/src/game/quests';
import { seededRng } from '@/src/game/rng';
import { QUEST_TEMPLATES } from '@/src/content/quests';

import { newSave } from '@/src/save/migrate';

// No gear, so power is exactly the level-1 base of 100.
const lvl1 = { ...newSave().player, inventory: [], equipped: {} };

describe('successChance (creator rules)', () => {
  test('power meets or exceeds requirement → 100%', () => {
    expect(successChance(100, 100)).toBe(1);
    expect(successChance(150, 100)).toBe(1);
  });
  test('up to 50 points short → 60%', () => {
    expect(successChance(100, 101)).toBe(0.6);
    expect(successChance(100, 150)).toBe(0.6);
  });
  test('more than 50 points short → 20%', () => {
    expect(successChance(100, 151)).toBe(0.2);
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
  test('hard quests are sometimes a 60% gamble and sometimes a 20% long shot', () => {
    const chances = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const hard = generateBoard('d', lvl1, seededRng(`s${i}`))[2];
      chances.add(successChance(100, hard.requiredPower));
    }
    expect(chances).toEqual(new Set([0.6, 0.2]));
  });
});

test('every quest template has a success and a failure story', () => {
  for (const t of QUEST_TEMPLATES) {
    expect(t.success.length).toBeGreaterThan(40);
    expect(t.failure.length).toBeGreaterThan(40);
  }
});
