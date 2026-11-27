jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/src/notify/questNotifications', () => ({
  scheduleReturn: jest.fn(async () => {}),
  cancelReturn: jest.fn(async () => {}),
  ensurePermission: jest.fn(async () => true),
}));

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ensurePermission, scheduleReturn } from '@/src/notify/questNotifications';
import { addDays } from '@/src/game/dates';
import HomeScreen from '@/app/(tabs)/index';
import { dayKey } from '@/src/game/dates';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';
import { habit } from '../helpers/save';

const today = dayKey(new Date());

beforeEach(() => useGameStore.setState({ save: newSave(), loaded: true }));

test('with no habits Home invites you to add one', async () => {
  await render(<HomeScreen />);
  expect(screen.getByText('Add a habit to start your journey.')).toBeTruthy();
});

test('with the gauge full an adventure can be chosen', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByRole('button', { name: 'Choose an adventure' })).toBeTruthy();
});

test('a returned hero shows the reveal with Collect', async () => {
  const s = newSave();
  s.pendingResult = {
    offer: { id: 'o', templateId: 't', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 80, rewardExp: 40, rewardGold: 20 },
    success: true,
    exp: 40,
    gold: 20,
    resolvedAt: new Date().toISOString(),
  };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByText('Your hero has returned!')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Collect' })).toBeTruthy();
});

test('today\'s habits are listed as checkboxes', async () => {
  const s = newSave();
  s.habits = [habit('Read 20 min')];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByRole('checkbox', { name: 'Read 20 min' })).toBeTruthy();
});

test('notification permission is asked before the return is scheduled', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose an adventure' }));
  await fireEvent.press(screen.getByRole('radio', { name: /^Slime Patrol/ }));
  await fireEvent.press(screen.getByRole('button', { name: /Set out/ }));
  await new Promise((r) => setTimeout(r, 0));
  const perm = (ensurePermission as jest.Mock).mock.invocationCallOrder[0];
  const sched = (scheduleReturn as jest.Mock).mock.invocationCallOrder[0];
  expect(perm).toBeLessThan(sched);
});

test('completing a habit removes it from today; Undo brings it back', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Read'), emoji: '📚' }, habit('Walk')];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Read' }));
  expect(screen.queryByRole('checkbox', { name: 'Read' })).toBeNull();
  expect(screen.getByText('📚 Read · done')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByRole('checkbox', { name: 'Read' })).toBeTruthy();
});

test('logging a forgotten habit from yesterday removes it from that list too', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Walk'), createdAt: new Date(2020, 0, 1).toISOString() }];
  s.completions = [{ habitId: 'Walk', dayKey: today, at: new Date().toISOString() }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /yesterday/i }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Walk' }));
  expect(screen.queryByRole('checkbox', { name: 'Walk' })).toBeNull();
  expect(screen.getByText('All done for today')).toBeTruthy();
});

test('habits can be grouped by life area', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Read'), lifeArea: 'learning' }, { ...habit('Walk'), lifeArea: 'health' }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sort habits' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Life area' }));
  expect(useGameStore.getState().save.settings.groupBy).toBe('lifeArea');
  expect(screen.getByText('📚 Learning')).toBeTruthy();
  expect(screen.getByText('💪 Health')).toBeTruthy();
});

test('tapping a habit card opens it for editing', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /^Read, / }));
  await fireEvent.press(screen.getByRole('button', { name: /^Time of day:/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Evening' }));
  await fireEvent.press(screen.getByRole('button', { name: /^Emoji ✨/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Emoji 📚' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(useGameStore.getState().save.habits[0]).toMatchObject({ timeOfDay: 'evening', emoji: '📚' });
});

test('the return screen lets you read the adventure log story', async () => {
  const s = newSave();
  s.pendingResult = {
    offer: { id: 'o', templateId: 'slime-patrol', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 80, rewardExp: 40, rewardGold: 20 },
    success: true,
    exp: 40,
    gold: 20,
    resolvedAt: new Date().toISOString(),
    story: 'Our hero herded eleven slimes back over the stone wall.',
  };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.queryByText('Our hero herded eleven slimes back over the stone wall.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Read adventure log' }));
  expect(screen.getByText('Our hero herded eleven slimes back over the stone wall.')).toBeTruthy();
});

test('with habits but none scheduled today, the gauge says so instead of asking for a habit', async () => {
  const s = newSave();
  const notToday = ([0, 1, 2, 3, 4, 5, 6] as const).filter((d) => d !== new Date().getDay());
  s.habits = [{ ...habit('Gym'), schedule: { kind: 'weekdays', days: [notToday[0]] } }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.queryByText('Add a habit to start your journey.')).toBeNull();
  expect(screen.getByText('No habits are scheduled today. Your hero is resting.')).toBeTruthy();
});

test('in development builds a running adventure shows a Skip button for testing', async () => {
  const s = newSave();
  s.activeRun = {
    offer: { id: 'o', templateId: 'slime-patrol', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 80, rewardExp: 40, rewardGold: 20 },
    dayKey: today,
    startedAt: new Date().toISOString(),
    successChance: 1,
  };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Skip: win' }));
  expect(useGameStore.getState().save.pendingResult).not.toBeNull();
});

test('a gear drop shows on the return screen and can be equipped right away', async () => {
  const s = newSave();
  s.player = { ...s.player, exp: 0 };
  s.pendingResult = {
    offer: { id: 'o', templateId: 'slime-patrol', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 80, rewardExp: 40, rewardGold: 20 },
    success: true,
    exp: 40,
    gold: 20,
    resolvedAt: '2026-11-27T18:00:00.000Z',
    drop: { gearId: 'leather-cap' },
  };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByText('Leather Cap')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Collect and equip' }));
  const p = useGameStore.getState().save.player;
  const cap = p.inventory.find((i) => i.gearId === 'leather-cap')!;
  expect(p.equipped.head).toBe(cap.uid);
});

test('the adventure board shows the length after Speed', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  s.player = { ...s.player, stats: { power: 0, defense: 0, luck: 0, speed: 10 } }; // ×0.85 → 6h 48m
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose an adventure' }));
  expect(screen.getAllByText(/6h 48m/).length).toBeGreaterThan(0);
});

describe('regions, bosses and debug', () => {
  const withHabit = () => {
    const s = newSave();
    s.habits = [habit('Read')];
    s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
    return s;
  };

  test('the region chip opens the map, which explains why a region is locked', async () => {
    useGameStore.setState({ save: withHabit() });
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Map. You are at home' }));
    expect(screen.getByText('Clear every adventure in Thornwick Meadows first.')).toBeTruthy();
  });

  test('the adventure board is titled with the region', async () => {
    useGameStore.setState({ save: withHabit() });
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Choose an adventure' }));
    expect(screen.getByText('Adventures in Thornwick Meadows')).toBeTruthy();
  });

  test('without a boss habit, Home offers to choose one; with one, it shows tokens', async () => {
    useGameStore.setState({ save: withHabit() });
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Choose a boss habit' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Read' }));
    expect(useGameStore.getState().save.boss.habitId).toBe('Read');
    expect(screen.getByRole('button', { name: 'Boss habit Read, 0 of 6 tokens. Change' })).toBeTruthy();
  });

  test('with a full gauge and 6 tokens the button becomes Boss fight, which replaces the adventure', async () => {
    const s = withHabit();
    s.boss = { habitId: 'Read', tokenEpoch: null, bonusTokens: 6 };
    useGameStore.setState({ save: s });
    await render(<HomeScreen />);
    expect(screen.queryByRole('button', { name: 'Choose an adventure' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Boss fight' }));
    await fireEvent.press(screen.getByRole('radio', { name: /^Extreme/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fight Old Bramblehide (Extreme)' }));
    await new Promise((r) => setTimeout(r, 0));
    const run = useGameStore.getState().save.activeRun;
    expect(run?.kind).toBe('boss');
    expect(run?.boss?.difficulty).toBe('extreme');
    expect(screen.getByLabelText('Old Bramblehide, the boss')).toBeTruthy();
  });

  test('the boss menu can send you adventuring instead, keeping your tokens', async () => {
    const s = withHabit();
    s.boss = { habitId: 'Read', tokenEpoch: null, bonusTokens: 6 };
    useGameStore.setState({ save: s });
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Boss fight' }));
    await fireEvent.press(screen.getByRole('button', { name: /Go adventuring instead/ }));
    expect(screen.getByText('Adventures in Thornwick Meadows')).toBeTruthy();
  });

  test('a first clear shows its memento on the return screen', async () => {
    const s = newSave();
    s.pendingResult = {
      offer: { id: 'o', templateId: 'slime-patrol', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 90, rewardExp: 40, rewardGold: 20, regionId: 'thornwick-meadows' },
      success: true, exp: 40, gold: 20, resolvedAt: '2026-11-27T18:00:00.000Z',
      memento: { regionId: 'thornwick-meadows', mementoId: 'plum-jam-jar' },
    };
    useGameStore.setState({ save: s });
    await render(<HomeScreen />);
    expect(screen.getByText('Empty Jam Jar')).toBeTruthy();
  });

});

test('the return screen includes the familiar bonus and the level-up it causes', async () => {
  const s = newSave();
  s.player = { ...s.player, exp: 61 }; // 61 + 40 × 1.0 = 101 → level 2 only with a bonus... use EXP familiar
  s.familiars = { owned: ['bog-toad'], active: 'bog-toad' }; // +4% EXP
  s.pendingResult = {
    offer: { id: 'o', templateId: 'slime-patrol', name: 'Slime Patrol', flavour: 'f', difficulty: 'easy', requiredPower: 90, rewardExp: 38, rewardGold: 20 },
    success: true, exp: 38, gold: 20, resolvedAt: '2026-11-27T18:00:00.000Z',
  };
  s.player.exp = 61; // 61 + 38 = 99 (no level); 61 + round(38 × 1.04) = 101 (level up)
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByText('+40')).toBeTruthy();
  expect(screen.getByText(/Bog Toad: \+4% EXP/)).toBeTruthy();
  expect(screen.getByText(/Level up/)).toBeTruthy();
});

test('the Undo popup does not restart its timer when the screen updates', async () => {
  jest.useFakeTimers();
  const s = newSave();
  s.habits = [habit('Read'), habit('Walk')];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Read' }));
  await act(async () => jest.advanceTimersByTime(4000));
  await act(async () => useGameStore.getState().setGroupBy('lifeArea')); // any update
  await act(async () => jest.advanceTimersByTime(2500));
  expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  jest.useRealTimers();
});

test('archiving the boss habit warns that tokens will reset', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.boss = { habitId: 'Read', tokenEpoch: null, bonusTokens: 4 };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /^Read, / }));
  await fireEvent.press(screen.getByRole('button', { name: 'Archive habit' }));
  expect(screen.getByText(/This is your boss habit\. Archiving it resets your 4 boss tokens\./)).toBeTruthy();
});

test('a boss fight that cannot start says so', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  s.boss = { habitId: 'Read', tokenEpoch: null, bonusTokens: 6 };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Boss fight' }));
  useGameStore.setState({ save: { ...useGameStore.getState().save, boss: { habitId: 'Read', tokenEpoch: null, bonusTokens: 0 } } });
  await fireEvent.press(screen.getByRole('button', { name: /^Fight / }));
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.getByText('The boss fight could not start. Check your tokens and try again.')).toBeTruthy();
});

test('screen readers can move a habit down past an empty section into the next', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Run'), timeOfDay: 'afternoon' }, { ...habit('Read'), timeOfDay: 'evening' }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent(screen.getByRole('button', { name: /^Run, / }), 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } });
  expect(useGameStore.getState().save.habits.find((h) => h.id === 'Run')?.timeOfDay).toBe('evening');
});


test('a section + button starts a new habit in that section', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Run'), timeOfDay: 'morning' }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Add a habit to Morning' }));
  await fireEvent.changeText(screen.getByLabelText('Habit name'), 'Stretch');
  await fireEvent.press(screen.getByRole('button', { name: 'Add habit' }));
  expect(useGameStore.getState().save.habits.find((h) => h.name === 'Stretch')?.timeOfDay).toBe('morning');
});

test('custom order shows one list without section headers', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Run'), timeOfDay: 'morning' }, { ...habit('Read'), timeOfDay: 'evening' }];
  s.settings = { groupBy: 'custom' };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.queryByText('Morning')).toBeNull();
  expect(screen.getByRole('button', { name: /^Run, / })).toBeTruthy();
});

test('the boss preview shows each difficulty\'s required power and chance', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  s.boss = { habitId: 'Read', tokenEpoch: null, bonusTokens: 6 };
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Boss fight' }));
  expect(screen.getByText('100%')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: /^Hard/ }));
  expect(screen.getByText('50%')).toBeTruthy();
  expect(screen.getByText(/Requires 170 power · You have 105/)).toBeTruthy();
});

