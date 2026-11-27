import { generateBoard } from '@/src/game/quests';
import { collectResult, resolveQuest, startQuest } from '@/src/game/questRun';
import { seededRng } from '@/src/game/rng';
import type { SaveData } from '@/src/game/types';
import { canTravel, currentRegion, isRegionComplete, isRegionUnlocked, travel } from '@/src/game/world';
import { newSave } from '@/src/save/migrate';
import { at, habit } from '../helpers/save';

const DAY = '2026-11-27';
const MEADOW = 'thornwick-meadows';
const MARSH = 'willowmere-marsh';
const now = at(DAY, 20);

function strong(power: number): SaveData {
  const s = newSave();
  s.player = { ...s.player, inventory: [], equipped: {}, level: 1 + Math.round((power - 100) / 15) };
  return s;
}
const cleared = (s: SaveData, regionId: string, ids: string[], bossDefeated = false): SaveData => ({
  ...s,
  world: { ...s.world, regions: { ...s.world.regions, [regionId]: { cleared: ids, mementos: [], bossDefeated } } },
});
const ALL_MEADOW = ['slime-patrol', 'herb-gathering', 'missing-goat'];

test('an unknown current region falls back to the first region', () => {
  const s = newSave();
  expect(currentRegion({ ...s, world: { ...s.world, currentRegion: 'gone' } }).id).toBe(MEADOW);
});

test('travel needs the current region cleared', () => {
  const r = canTravel(strong(160), MARSH, now);
  expect(r).toEqual({ ok: false, reason: 'Clear every adventure in Thornwick Meadows first.' });
});

test('travel needs enough power', () => {
  const r = canTravel(cleared(strong(115), MEADOW, ALL_MEADOW), MARSH, now);
  expect(r).toEqual({ ok: false, reason: 'Needs 130 power. You have 115.' });
});

test('travel works once both are met, and switches the board', () => {
  const s = cleared(strong(130), MEADOW, ALL_MEADOW);
  expect(canTravel(s, MARSH, now)).toEqual({ ok: true });
  const t = travel(s, MARSH, now);
  expect(t.world.currentRegion).toBe(MARSH);
  expect(t.board).toBeNull();
  expect(isRegionUnlocked(t, MARSH)).toBe(true);
});

test('travel back to an unlocked region is always allowed', () => {
  const s = travel(cleared(strong(130), MEADOW, ALL_MEADOW), MARSH, now);
  expect(canTravel(s, MEADOW, now)).toEqual({ ok: true });
});

test('a visited region stays unlocked even if power drops later', () => {
  const s = travel(cleared(strong(130), MEADOW, ALL_MEADOW), MARSH, now);
  const weaker = { ...s, player: { ...s.player, level: 1 } };
  expect(isRegionUnlocked(weaker, MARSH)).toBe(true);
});

test('no travel while an adventure is running', () => {
  const s = cleared(strong(130), MEADOW, ALL_MEADOW);
  s.habits = [habit('a')];
  s.completions = [{ habitId: 'a', dayKey: DAY, at: at(DAY, 8).toISOString() }];
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  const running = startQuest(s, `${DAY}-easy`, at(DAY, 9));
  expect(canTravel(running, MARSH, at(DAY, 10))).toEqual({ ok: false, reason: 'Your hero is out on an adventure. Travel once they are home.' });
});

test('first clear of an adventure gives its memento once', () => {
  const s = newSave();
  s.habits = [habit('a')];
  s.completions = [{ habitId: 'a', dayKey: DAY, at: at(DAY, 8).toISOString() }];
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  const done = resolveQuest(startQuest(s, `${DAY}-easy`, at(DAY, 9)), at(DAY, 18), () => 0.5);
  expect(done.pendingResult?.memento).toEqual({ regionId: MEADOW, mementoId: 'plum-jam-jar' });
  expect(done.world.regions[MEADOW].cleared).toEqual(['slime-patrol']);
  const next = collectResult(done).save;
  const again = { ...next, lastQuestStartedDayKey: null, completions: [{ habitId: 'a', dayKey: DAY, at: at(DAY, 19).toISOString() }] };
  const second = resolveQuest(startQuest(again, `${DAY}-easy`, at(DAY, 19, 30)), at('2026-11-28', 4), () => 0.5);
  expect(second.pendingResult?.memento).toBeUndefined();
  expect(second.world.regions[MEADOW].mementos).toEqual(['plum-jam-jar']);
});

test('a failed adventure is not a clear', () => {
  const s = newSave();
  s.habits = [habit('a')];
  s.completions = [{ habitId: 'a', dayKey: DAY, at: at(DAY, 8).toISOString() }];
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  const run = startQuest(s, `${DAY}-hard`, at(DAY, 9));
  const lost = resolveQuest(run, at(DAY, 18), () => 0.99);
  expect(lost.world.regions[MEADOW]?.cleared ?? []).toEqual([]);
});

test('a region is complete only when its boss is beaten too', () => {
  expect(isRegionComplete(cleared(newSave(), MEADOW, ALL_MEADOW), MEADOW)).toBe(false);
  expect(isRegionComplete(cleared(newSave(), MEADOW, ALL_MEADOW, true), MEADOW)).toBe(true);
});
