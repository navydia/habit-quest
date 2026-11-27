import { collectResult, isReturned, questEndTime, resolveQuest, startQuest } from '@/src/game/questRun';
import { generateBoard } from '@/src/game/quests';
import { seededRng } from '@/src/game/rng';
import type { Completion, SaveData } from '@/src/game/types';
import { at, emptySave, habit } from '../helpers/save';

const DAY = '2026-11-27';
const HOUR = 3600_000;

function readySave(): SaveData {
  const s = emptySave();
  s.habits = ['a', 'b', 'c', 'd', 'e'].map((id) => habit(id));
  s.completions = ['a', 'b', 'c'].map((id) => ({ habitId: id, dayKey: DAY, at: at(DAY, 8).toISOString() }));
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  return s;
}

const started = () => startQuest(readySave(), `${DAY}-easy`, at(DAY, 9));
const after = (n: number, startHour = 9): Completion[] =>
  Array.from({ length: n }, (_, i) => ({ habitId: `x${i}`, dayKey: DAY, at: at(DAY, startHour, 1 + i).toISOString() }));

test('startQuest records the run, the day and the success chance', () => {
  const s = started();
  expect(s.activeRun?.offer.id).toBe(`${DAY}-easy`);
  expect(s.activeRun?.successChance).toBe(1);
  expect(s.lastQuestStartedDayKey).toBe(DAY);
});

test('startQuest throws when a quest was already started today', () => {
  const s = started();
  expect(() => startQuest({ ...s, activeRun: null }, `${DAY}-normal`, at(DAY, 10))).toThrow();
});

test('startQuest throws for an unknown offer', () => {
  expect(() => startQuest(readySave(), 'nope', at(DAY, 9))).toThrow();
});

describe('questEndTime', () => {
  const run = started().activeRun!;
  test('8 hours with no later completions', () => {
    expect(questEndTime(run, []).getTime()).toBe(at(DAY, 17).getTime());
  });
  test('each completion after the start cuts 20 minutes', () => {
    expect(questEndTime(run, after(3)).getTime()).toBe(at(DAY, 16).getTime());
  });
  test('reductions stop at the 5-hour floor', () => {
    expect(questEndTime(run, after(20)).getTime()).toBe(at(DAY, 14).getTime());
  });
  test('completions from before the start do not count', () => {
    expect(questEndTime(run, readySave().completions).getTime()).toBe(at(DAY, 17).getTime());
  });
  test('a backfilled habit for yesterday, logged during the run, still counts', () => {
    const c = [{ habitId: 'y', dayKey: '2026-11-26', at: at(DAY, 10).toISOString() }];
    expect(questEndTime(run, c).getTime()).toBe(at(DAY, 16, 40).getTime());
  });
  test('removing a completion moves the return 20 minutes later and the run stays active', () => {
    const s = { ...started(), completions: [...readySave().completions, ...after(2)] };
    const before = questEndTime(s.activeRun!, s.completions).getTime();
    const less = s.completions.slice(0, -1);
    expect(questEndTime(s.activeRun!, less).getTime() - before).toBe(20 * 60_000);
    expect(s.activeRun).not.toBeNull();
  });
});

test('isReturned flips at the end time', () => {
  const run = started().activeRun!;
  expect(isReturned(run, [], at(DAY, 16, 59))).toBe(false);
  expect(isReturned(run, [], at(DAY, 17))).toBe(true);
});

describe('resolveQuest', () => {
  test('before the end time nothing changes', () => {
    const s = started();
    expect(resolveQuest(s, at(DAY, 12), () => 0)).toBe(s);
  });
  test('app closed for the whole quest: opened 10 hours later the result is waiting', () => {
    const s = resolveQuest(started(), at(DAY, 19), () => 0.5);
    expect(s.activeRun).toBeNull();
    expect(s.pendingResult).toMatchObject({ success: true, exp: 40, gold: 20 });
    expect(s.questLog).toHaveLength(1);
  });
  test('failure still pays 25% of the rewards', () => {
    const s = started();
    s.activeRun = { ...s.activeRun!, successChance: 0.6 };
    const r = resolveQuest(s, at(DAY, 18), () => 0.99);
    expect(r.pendingResult).toMatchObject({ success: false, exp: 10, gold: 5 });
  });
  test('nothing happens without an active run', () => {
    const s = readySave();
    expect(resolveQuest(s, at(DAY, 18), () => 0)).toBe(s);
  });
});

test('collectResult adds gold and exp and reports level-ups', () => {
  const s = resolveQuest(started(), at(DAY, 18), () => 0);
  s.player.exp = 90;
  const { save, levelsGained } = collectResult(s);
  expect(save.player.gold).toBe(20);
  expect(save.player.level).toBe(2);
  expect(levelsGained).toBe(1);
  expect(save.pendingResult).toBeNull();
});

test('unchecking and re-checking a habit done before the start gives no free cut', () => {
  const s = started();
  const pre = s.completions[0];
  const rechecked = [...s.completions.filter((c) => c !== pre), { ...pre, at: at(DAY, 10).toISOString() }];
  expect(questEndTime(s.activeRun!, rechecked).getTime()).toBe(at(DAY, 17).getTime());
});

test('runs saved before preStartKeys existed still compute an end time', () => {
  const run = { ...started().activeRun! } as any;
  delete run.preStartKeys;
  expect(questEndTime(run, after(3)).getTime()).toBe(at(DAY, 16).getTime());
});
