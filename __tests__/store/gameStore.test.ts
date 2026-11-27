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

describe('regions and bosses', () => {
  test('travelling changes the board to the new region', () => {
    const s = g().save;
    useGameStore.setState({
      save: {
        ...s,
        player: { ...s.player, level: 4 },
        world: { currentRegion: 'thornwick-meadows', regions: { 'thornwick-meadows': { cleared: ['slime-patrol', 'herb-gathering', 'missing-goat'], mementos: [], bossDefeated: false } } },
      },
    });
    g().ensureBoard(at(DAY, 9));
    g().travel('willowmere-marsh', at(DAY, 9));
    g().ensureBoard(at(DAY, 9));
    expect(g().save.board?.offers[0].regionId).toBe('willowmere-marsh');
  });

  test('choosing a boss habit and starting with a boss spends tokens', () => {
    twoHabitsDone();
    const [a] = g().save.habits;
    g().setBossHabit(a.id, at('2026-11-20', 7));
    const days = ['21', '22', '23', '24', '25', '26'].map((d) => `2026-11-${d}`);
    useGameStore.setState({ save: { ...g().save, completions: [...g().save.completions, ...days.map((d) => ({ habitId: a.id, dayKey: d, at: at(d, 8).toISOString() }))] } });
    g().ensureBoard(at(DAY, 9));
    expect(g().startBossFight('old-bramblehide', 'hard', at(DAY, 9))).toBe(true);
    expect(g().save.activeRun?.boss?.difficulty).toBe('hard');
    expect(g().save.activeRun?.kind).toBe('boss');
  });

  test('the active familiar can be set and cleared', () => {
    useGameStore.setState({ save: { ...g().save, familiars: { owned: ['hoglet'], active: null } } });
    g().setActiveFamiliar('hoglet');
    expect(g().save.familiars.active).toBe('hoglet');
    g().setActiveFamiliar('not-owned');
    expect(g().save.familiars.active).toBe('hoglet');
    g().setActiveFamiliar(null);
    expect(g().save.familiars.active).toBeNull();
  });
});

test('a boss fight without 6 tokens does not start and says so', () => {
  twoHabitsDone();
  expect(g().startBossFight('old-bramblehide', 'normal', at(DAY, 9))).toBe(false);
  expect(g().save.activeRun).toBeNull();
});

test('completing never unticks; undo does', () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7), { emoji: '📚', lifeArea: 'learning', timeOfDay: 'evening' });
  const h = g().save.habits[0];
  expect(h).toMatchObject({ emoji: '📚', lifeArea: 'learning', timeOfDay: 'evening' });
  g().completeHabit(h.id, DAY, at(DAY, 8));
  g().completeHabit(h.id, DAY, at(DAY, 8, 1));
  expect(g().save.completions).toHaveLength(1);
  g().undoCompletion(h.id, DAY, at(DAY, 8, 2));
  expect(g().save.completions).toHaveLength(0);
});

test('removing from history keeps the habit done', () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  const h = g().save.habits[0];
  g().completeHabit(h.id, DAY, at(DAY, 8));
  g().hideFromHistory(h.id, DAY);
  expect(g().save.completions[0]).toMatchObject({ hidden: true, habitId: h.id });
});

test('habits can be edited and grouping saved', () => {
  g().addHabit('Read', { kind: 'daily' }, at(DAY, 7));
  const h = g().save.habits[0];
  g().updateHabit(h.id, { name: ' Read more ', schedule: { kind: 'interval', every: 2 }, lifeArea: 'mind' });
  expect(g().save.habits[0]).toMatchObject({ name: 'Read more', schedule: { kind: 'interval', every: 2 }, lifeArea: 'mind' });
  g().setGroupBy('lifeArea');
  expect(g().save.settings.groupBy).toBe('lifeArea');
});

test('archiving the boss habit clears it', () => {
  twoHabitsDone();
  const [a] = g().save.habits;
  g().setBossHabit(a.id, at('2026-11-20', 7));
  g().archiveHabit(a.id, at(DAY, 10));
  expect(g().save.boss.habitId).toBeNull();
});

test('Skip (testing) can force a win or a loss', () => {
  twoHabitsDone();
  g().ensureBoard(at(DAY, 9));
  g().startQuest(`${DAY}-hard`, at(DAY, 9));
  g().skipAdventure(at(DAY, 9, 5), 'lose');
  expect(g().save.pendingResult?.success).toBe(false);
  useGameStore.setState({ save: { ...g().save, pendingResult: null, lastQuestStartedDayKey: null } });
  g().startQuest(`${DAY}-hard`, at(DAY, 10));
  g().skipAdventure(at(DAY, 10, 5), 'win');
  expect(g().save.pendingResult?.success).toBe(true);
});

test('habits can be moved and custom order chosen', () => {
  g().addHabit('A', { kind: 'daily' }, at(DAY, 7));
  g().addHabit('B', { kind: 'daily' }, at(DAY, 7));
  const [a, b] = g().save.habits;
  g().moveHabit(b.id, { beforeId: a.id, timeOfDay: 'evening' });
  expect(g().save.habits.find((h) => h.id === b.id)?.timeOfDay).toBe('evening');
  g().setGroupBy('custom');
  expect(g().save.settings.groupBy).toBe('custom');
});

test('a new habit goes to the end of the custom order, even after reordering', () => {
  g().addHabit('A', { kind: 'daily' }, at(DAY, 7));
  g().addHabit('B', { kind: 'daily' }, at(DAY, 7));
  const [a, b] = g().save.habits;
  g().moveHabit(b.id, { beforeId: a.id });
  g().addHabit('C', { kind: 'daily' }, at(DAY, 7));
  const c = g().save.habits.find((h) => h.name === 'C')!;
  expect(c.order).toBeGreaterThan(Math.max(...g().save.habits.filter((h) => h !== c).map((h) => h.order ?? 0)));
});
