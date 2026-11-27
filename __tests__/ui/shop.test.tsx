jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('@/src/notify/questNotifications', () => ({ scheduleReturn: jest.fn(async () => {}), cancelReturn: jest.fn(async () => {}), ensurePermission: jest.fn(async () => true) }));

import { fireEvent, render, screen } from '@testing-library/react-native';
import ShopScreen from '@/app/(tabs)/shop';
import LogScreen from '@/app/(tabs)/log';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';

const g = () => useGameStore.getState();

test('the armory shows the weekly special and today\'s stock; buying needs gold', async () => {
  useGameStore.setState({ save: newSave(), loaded: true });
  await render(<ShopScreen />);
  expect(screen.getByText(/This week/)).toBeTruthy();
  await fireEvent.press(screen.getAllByRole('button', { name: /^Buy · / })[0]);
  expect(screen.getByText(/more gold/)).toBeTruthy();
});

test('potions can be bought and drunk from the apothecary', async () => {
  useGameStore.setState({ save: { ...newSave(), player: { ...newSave().player, gold: 500 } }, loaded: true });
  await render(<ShopScreen />);
  await fireEvent.press(screen.getByRole('tab', { name: 'Apothecary' }));
  await fireEvent.press(screen.getAllByRole('button', { name: 'Buy · 80 gold' })[0]);
  expect(g().save.player.gold).toBe(420);
  await fireEvent.press(screen.getAllByRole('button', { name: 'Drink' })[0]);
  expect(g().save.potions.active).toBe('fortune');
  expect(screen.getByText('Active for your next trip')).toBeTruthy();
});

test('finished daily quests can be claimed in the Log', async () => {
  const s = newSave();
  const today = require('@/src/game/dates').dayKey(new Date());
  s.daily = { dayKey: today, quests: [{ id: 'q', kind: 'buy', event: 'buy', title: 'Buy an item in the Shop', target: 1, progress: 1, reward: 50, claimed: false }] };
  useGameStore.setState({ save: s, loaded: true });
  await render(<LogScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Claim' }));
  expect(g().save.player.gold).toBe(50);
  expect(screen.getByText('Claimed')).toBeTruthy();
});
