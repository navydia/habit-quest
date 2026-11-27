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

import { render, screen } from '@testing-library/react-native';
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

test('with the gauge full a quest can be chosen', async () => {
  const s = newSave();
  s.habits = [habit('Read')];
  s.completions = [{ habitId: 'Read', dayKey: today, at: new Date().toISOString() }];
  useGameStore.setState({ save: s });
  await render(<HomeScreen />);
  expect(screen.getByRole('button', { name: 'Choose a quest' })).toBeTruthy();
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
