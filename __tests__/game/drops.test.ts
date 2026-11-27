import { gearById } from '@/src/content/gear';
import { dropChance, rollDrop } from '@/src/game/drops';
import { collectResult, questEndTime, resolveQuest, startQuest } from '@/src/game/questRun';
import { generateBoard } from '@/src/game/quests';
import { seededRng } from '@/src/game/rng';
import type { Player, SaveData } from '@/src/game/types';
import { newSave } from '@/src/save/migrate';
import { at, habit } from '../helpers/save';

const DAY = '2026-11-27';
const withLuck = (luck: number): Player => ({ ...newSave().player, stats: { power: 0, defense: 0, luck, speed: 0 } });

test('drop chance by difficulty, plus one point per Luck', () => {
  expect(dropChance('easy', withLuck(0))).toBeCloseTo(0.15);
  expect(dropChance('normal', withLuck(0))).toBeCloseTo(0.25);
  expect(dropChance('hard', withLuck(0))).toBeCloseTo(0.45);
  expect(dropChance('hard', withLuck(5))).toBeCloseTo(0.5);
});

test('a roll above the chance drops nothing', () => {
  expect(rollDrop('easy', withLuck(0), () => 0.99)).toBeNull();
});

test('the luckiest roll lands on a common item; the unluckiest rarity roll on legendary', () => {
  const seq = (...v: number[]) => () => v.shift() ?? 0;
  expect(rollDrop('easy', withLuck(0), seq(0, 0, 0))?.rarity).toBe('common');
  expect(rollDrop('easy', withLuck(0), seq(0, 0.9999, 0))?.rarity).toBe('legendary');
});

function readySave(speed = 0): SaveData {
  const s = newSave();
  s.player = { ...s.player, stats: { power: 0, defense: 0, luck: 0, speed } };
  s.habits = [habit('a')];
  s.completions = [{ habitId: 'a', dayKey: DAY, at: at(DAY, 8).toISOString() }];
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  return s;
}

test('failed quests never drop gear', () => {
  const s = startQuest(readySave(), `${DAY}-normal`, at(DAY, 9));
  s.activeRun = { ...s.activeRun!, successChance: 0.6 };
  expect(resolveQuest(s, at(DAY, 18), () => 0.99).pendingResult?.drop).toBeUndefined();
});

test('collecting a drop adds it to the inventory', () => {
  const s = startQuest(readySave(), `${DAY}-easy`, at(DAY, 9));
  const r = resolveQuest(s, at(DAY, 18), () => 0); // success, drop, common
  const drop = r.pendingResult!.drop!;
  expect(gearById(drop.gearId)).toBeDefined();
  const { save } = collectResult(r);
  expect(save.player.inventory.map((i) => i.gearId)).toContain(drop.gearId);
  expect(new Set(save.player.inventory.map((i) => i.uid)).size).toBe(save.player.inventory.length);
});

test('Speed 10 turns an 8 hour quest into 6 h 48 min', () => {
  const s = startQuest(readySave(10), `${DAY}-easy`, at(DAY, 9));
  expect(questEndTime(s.activeRun!, s.completions).getTime()).toBe(at(DAY, 15, 48).getTime());
});

test('Speed applies after the 5 hour floor', () => {
  const s = startQuest(readySave(10), `${DAY}-easy`, at(DAY, 9));
  const many = Array.from({ length: 20 }, (_, i) => ({ habitId: `x${i}`, dayKey: DAY, at: at(DAY, 10).toISOString() }));
  expect(questEndTime(s.activeRun!, many).getTime()).toBe(at(DAY, 13, 15).getTime()); // 5h × 0.85
});

test('runs saved before speedFactor existed use 1', () => {
  const s = startQuest(readySave(10), `${DAY}-easy`, at(DAY, 9));
  const run = { ...s.activeRun! } as any;
  delete run.speedFactor;
  expect(questEndTime(run, []).getTime()).toBe(at(DAY, 17).getTime());
});
