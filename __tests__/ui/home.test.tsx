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

import { fireEvent, render, screen } from '@testing-library/react-native';
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
  await fireEvent.press(screen.getAllByRole('radio')[0]);
  await fireEvent.press(screen.getByRole('button', { name: /Set out/ }));
  await new Promise((r) => setTimeout(r, 0));
  const perm = (ensurePermission as jest.Mock).mock.invocationCallOrder[0];
  const sched = (scheduleReturn as jest.Mock).mock.invocationCallOrder[0];
  expect(perm).toBeLessThan(sched);
});

test('a habit backfilled for yesterday can still be unchecked', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Walk'), createdAt: new Date(2020, 0, 1).toISOString() }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /yesterday/i }));
  const boxes = () => screen.getAllByRole('checkbox', { name: 'Walk' });
  await fireEvent.press(boxes()[1]); // log yesterday
  expect(boxes()).toHaveLength(2);
  expect(boxes()[1].props.accessibilityState.checked).toBe(true);
  await fireEvent.press(boxes()[1]); // undo the accidental tick
  expect(boxes()[1].props.accessibilityState.checked).toBe(false);
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
  await fireEvent.press(screen.getByRole('button', { name: 'Skip (testing)' }));
  expect(useGameStore.getState().save.pendingResult).not.toBeNull();
});
