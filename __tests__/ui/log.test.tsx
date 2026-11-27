jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));
jest.mock('@/src/notify/questNotifications', () => ({ scheduleReturn: jest.fn(async () => {}), cancelReturn: jest.fn(async () => {}), ensurePermission: jest.fn(async () => true) }));

import { fireEvent, render, screen } from '@testing-library/react-native';
import LogScreen from '@/app/(tabs)/log';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';
import { habit } from '../helpers/save';

test('history lists completed habits; removing one hides it but keeps it done', async () => {
  const s = newSave();
  s.habits = [{ ...habit('Read'), emoji: '📚' }];
  s.completions = [{ habitId: 'Read', dayKey: '2026-11-27', at: '2026-11-27T09:00:00.000Z' }];
  useGameStore.setState({ save: s, loaded: true });
  await render(<LogScreen />);
  expect(screen.getByText('Read')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove Read from history' }));
  expect(screen.queryByText('Read')).toBeNull();
  expect(useGameStore.getState().save.completions).toHaveLength(1);
});

test('the Log holds mail, daily quests and scrapbooks', async () => {
  useGameStore.setState({ save: newSave(), loaded: true });
  await render(<LogScreen />);
  expect(screen.getByText('Mail')).toBeTruthy();
  expect(screen.getByText('Daily quests')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: /Thornwick Meadows scrapbook/ }));
  expect(screen.getByText('Scrapbook: Thornwick Meadows')).toBeTruthy();
});

test('history days are newest first even when yesterday was logged later', async () => {
  const s = newSave();
  s.habits = [habit('Read'), habit('Walk')];
  s.completions = [
    { habitId: 'Read', dayKey: '2026-11-27', at: '2026-11-27T09:00:00.000Z' },
    { habitId: 'Walk', dayKey: '2026-11-26', at: '2026-11-27T10:00:00.000Z' },
  ];
  useGameStore.setState({ save: s, loaded: true });
  await render(<LogScreen />);
  const names = screen.getAllByText(/^(Read|Walk)$/).map((n) => n.props.children);
  expect(names).toEqual(['Read', 'Walk']);
});
