import { canStartQuest, gaugeProgress, gaugeTarget } from '@/src/game/gauge';
import type { QuestRun, SaveData } from '@/src/game/types';
import { at, emptySave, habit } from '../helpers/save';

test('gauge target is 60% of scheduled habits, rounded up, minimum 1', () => {
  expect([0, 1, 3, 5, 10].map(gaugeTarget)).toEqual([1, 1, 2, 3, 6]);
});

test('with no habits the gauge is empty and says so', () => {
  expect(gaugeProgress(emptySave(), '2026-11-27')).toEqual({ done: 0, target: 1, full: false, hasHabits: false });
});

function withDone(n: number, total: number, day = '2026-11-27'): SaveData {
  const s = emptySave();
  s.habits = Array.from({ length: total }, (_, i) => habit(`h${i}`));
  s.completions = Array.from({ length: n }, (_, i) => ({ habitId: `h${i}`, dayKey: day, at: at(day, 8).toISOString() }));
  return s;
}

test('3 of 5 habits fills the gauge', () => {
  expect(gaugeProgress(withDone(3, 5), '2026-11-27')).toEqual({ done: 3, target: 3, full: true, hasHabits: true });
  expect(gaugeProgress(withDone(2, 5), '2026-11-27').full).toBe(false);
});

test('completions of unscheduled or other-day habits do not count', () => {
  const s = withDone(3, 5, '2026-11-26');
  expect(gaugeProgress(s, '2026-11-27').done).toBe(0);
});

const run: QuestRun = {
  offer: { id: 'o', templateId: 't', name: 'n', flavour: 'f', difficulty: 'easy', requiredPower: 1, rewardExp: 1, rewardGold: 1 },
  dayKey: '2026-11-26',
  startedAt: at('2026-11-26', 21).toISOString(),
  successChance: 1,
};

describe('canStartQuest', () => {
  const now = at('2026-11-27', 9);
  test('true when the gauge is full and nothing is in the way', () => {
    expect(canStartQuest(withDone(3, 5), now)).toBe(true);
  });
  test('false when a quest was already started today', () => {
    expect(canStartQuest({ ...withDone(3, 5), lastQuestStartedDayKey: '2026-11-27' }, now)).toBe(false);
  });
  test('false while yesterday\'s quest is still out', () => {
    expect(canStartQuest({ ...withDone(3, 5), activeRun: run, lastQuestStartedDayKey: '2026-11-26' }, now)).toBe(false);
  });
  test('true once yesterday\'s late quest has returned and been collected', () => {
    expect(canStartQuest({ ...withDone(3, 5), lastQuestStartedDayKey: '2026-11-26' }, now)).toBe(true);
  });
  test('false while a result waits to be collected', () => {
    const pendingResult = { offer: run.offer, success: true, exp: 1, gold: 1, resolvedAt: now.toISOString() };
    expect(canStartQuest({ ...withDone(3, 5), pendingResult }, now)).toBe(false);
  });
});
