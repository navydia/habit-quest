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
  memoryStore.set('save', JSON.stringify({ ...newSave(), player: { ...newSave().player, level: 3, gold: 5 } }));
  useGameStore.setState({ loaded: false });
  await g().load();
  expect(g().loaded).toBe(true);
  expect(g().save.player.level).toBe(3);
});

test('a double-tap on Set out does not throw and starts only one quest', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  expect(() => g().startQuest(`${DAY}-easy`, at(DAY, 9))).not.toThrow();
  expect(() => g().startQuest('stale-offer', at(DAY, 9))).not.toThrow();
  expect(g().save.activeRun?.offer.id).toBe(`${DAY}-easy`);
});

test('unchecking a habit just after the return time does not send the hero back out', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  g().toggleHabit(g().save.habits[0].id, DAY, at(DAY, 17, 0));
  expect(g().save.activeRun).toBeNull();
  expect(g().save.pendingResult).not.toBeNull();
});

test('if storage fails to load, the app still opens and never overwrites the stored save', async () => {
  const Storage = require('../helpers/memoryKv').default;
  const getItem = jest.spyOn(Storage, 'getItem').mockRejectedValueOnce(new Error('disk'));
  const setItem = jest.spyOn(Storage, 'setItem');
  useGameStore.setState({ loaded: false });
  await g().load();
  expect(g().loaded).toBe(true);
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  await new Promise((r) => setTimeout(r, 0));
  expect(setItem).not.toHaveBeenCalled();
  getItem.mockRestore();
  setItem.mockRestore();
});

describe('character actions', () => {
  const addItem = (gearId: string, uid = gearId) =>
    useGameStore.setState({ save: { ...g().save, player: { ...g().save.player, inventory: [...g().save.player.inventory, { uid, gearId, obtainedAt: '' }] } } });

  test('spending and resetting SP', () => {
    useGameStore.setState({ save: { ...g().save, player: { ...g().save.player, unspentSp: 2 } } });
    g().allocateSp('luck');
    expect(g().save.player.stats.luck).toBe(1);
    g().respec();
    expect(g().save.player.unspentSp).toBe(2);
  });

  test('equipping a bow swaps the weapon and changes the title', () => {
    addItem('hunting-bow');
    g().equip('hunting-bow');
    expect(g().save.player.equipped.weapon).toBe('hunting-bow');
    expect(g().save.player.title).toBe('Warden'); // bow +1 speed ties tunic +1 defense → defense comes first
  });

  test('unequipping the weapon makes you a Wanderer', () => {
    g().unequip('weapon');
    expect(g().save.player.equipped.weapon).toBeUndefined();
    expect(g().save.player.title).toBe('Wanderer');
  });

  test('changing gear mid-quest does not change the odds or the return time', () => {
    twoHabitsDone();
    g().ensureBoard(at(DAY, 9));
    g().startQuest(`${DAY}-hard`, at(DAY, 9));
    const before = { ...g().save.activeRun! };
    addItem('emberforged-blade');
    g().equip('emberforged-blade');
    expect(g().save.activeRun).toEqual(before);
  });

  test('equipping an unknown uid does nothing', () => {
    const before = g().save;
    g().equip('nope');
    expect(g().save).toBe(before);
  });
});

test('skip (testing) brings the hero home immediately', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  g().skipAdventure(at(DAY, 9, 5));
  expect(g().save.activeRun).toBeNull();
  expect(g().save.pendingResult).not.toBeNull();
});

test('skip does nothing when no adventure is running', () => {
  const before = g().save;
  g().skipAdventure(at(DAY, 9));
  expect(g().save).toBe(before);
});

test('skipping cancels the pending return notification', () => {
  const { cancelReturn } = require('@/src/notify/questNotifications');
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-easy`, at(DAY, 9));
  (cancelReturn as jest.Mock).mockClear();
  g().skipAdventure(at(DAY, 9, 5));
  expect(cancelReturn).toHaveBeenCalled();
});
