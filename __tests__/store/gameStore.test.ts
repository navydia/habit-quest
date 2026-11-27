jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));
jest.mock('@/src/notify/questNotifications', () => ({
  scheduleReturn: jest.fn(async () => {}),
  cancelReturn: jest.fn(async () => {}),
  ensurePermission: jest.fn(async () => true),
}));

import { scheduleReturn } from '@/src/notify/questNotifications';
import { canStartQuest } from '@/src/game/gauge';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';
import { memoryStore } from '../helpers/memoryKv';
import { at } from '../helpers/save';

const DAY = '2026-11-27';
const schedule = scheduleReturn as jest.Mock;
const g = () => useGameStore.getState();

beforeEach(() => {
  memoryStore.clear();
  schedule.mockClear();
  useGameStore.setState({ save: newSave(), loaded: true });
});

function twoHabitsDone() {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  g().addHabit('Stretch', { kind: 'daily' }, at(DAY, 7));
  for (const h of g().save.habits) g().toggleHabit(h.id, DAY, at(DAY, 8));
}

test('checking two of two habits makes a quest available', () => {
  twoHabitsDone();
  expect(canStartQuest(g().save, at(DAY, 9))).toBe(true);
});

test('starting a quest schedules the return 8 hours later', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  expect(g().save.activeRun).not.toBeNull();
  expect(schedule).toHaveBeenLastCalledWith(at(DAY, 17));
});

test('habits checked during a quest reschedule an earlier return; unchecking moves it back', () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  g().addHabit('Stretch', { kind: 'daily' }, at(DAY, 7));
  g().addHabit('Walk', { kind: 'daily' }, at(DAY, 7));
  const [a, b, c] = g().save.habits;
  g().toggleHabit(a.id, DAY, at(DAY, 8));
  g().toggleHabit(b.id, DAY, at(DAY, 8));
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  g().toggleHabit(c.id, DAY, at(DAY, 10));
  expect(schedule).toHaveBeenLastCalledWith(at(DAY, 16, 40));
  g().toggleHabit(c.id, DAY, at(DAY, 11));
  expect(schedule).toHaveBeenLastCalledWith(at(DAY, 17));
});

test('tick after the return then collect pays out gold', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  g().tick(at(DAY, 18));
  expect(g().save.pendingResult).not.toBeNull();
  g().collect();
  expect(g().save.player.gold).toBeGreaterThan(0);
  expect(g().save.pendingResult).toBeNull();
});

test('a habit cannot be logged three days back', () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  g().toggleHabit(g().save.habits[0].id, '2026-11-24', at(DAY, 8));
  expect(g().save.completions).toHaveLength(0);
});

test('the board is generated once per day and replaced the next day', () => {
  g().ensureBoard(at(DAY, 9));
  const first = g().save.board;
  g().ensureBoard(at(DAY, 20));
  expect(g().save.board).toBe(first);
  g().ensureBoard(at('2026-11-28', 9));
  expect(g().save.board?.dayKey).toBe('2026-11-28');
});

test('changes are persisted', async () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  await new Promise((r) => setTimeout(r, 0));
  expect(JSON.parse(memoryStore.get('save')!).habits).toHaveLength(1);
});

test('load reads the stored save', async () => {
  memoryStore.set('save', JSON.stringify({ ...newSave(), player: { level: 3, exp: 0, gold: 5, unspentSp: 0 } }));
  useGameStore.setState({ loaded: false });
  await g().load();
  expect(g().loaded).toBe(true);
  expect(g().save.player.level).toBe(3);
});
