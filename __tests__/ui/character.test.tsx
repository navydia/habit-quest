jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('expo-router', () => ({ Link: ({ children }: any) => children, router: { push: jest.fn() } }));
jest.mock('@/src/notify/questNotifications', () => ({ scheduleReturn: jest.fn(async () => {}), cancelReturn: jest.fn(async () => {}), ensurePermission: jest.fn(async () => true) }));

import { fireEvent, render, screen } from '@testing-library/react-native';
import CharacterScreen from '@/app/(tabs)/character';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';

const g = () => useGameStore.getState();

beforeEach(() => {
  const s = newSave();
  s.player = { ...s.player, unspentSp: 2, inventory: [...s.player.inventory, { uid: 'cap', gearId: 'leather-cap', obtainedAt: '' }] };
  useGameStore.setState({ save: s, loaded: true });
});

test('shows the class title and level', async () => {
  await render(<CharacterScreen />);
  expect(screen.getByText('Vanguard')).toBeTruthy();
  expect(screen.getByText(/Level 1/)).toBeTruthy();
});

test('the + button spends a skill point', async () => {
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Add a point to Luck' }));
  expect(g().save.player.stats.luck).toBe(1);
  expect(g().save.player.unspentSp).toBe(1);
});

test('equipping from the slot sheet fills the slot', async () => {
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /Head: empty/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Leather Cap' }));
  expect(g().save.player.equipped.head).toBe('cap');
});

test('resetting points asks for confirmation first', async () => {
  useGameStore.setState({ save: { ...g().save, player: { ...g().save.player, unspentSp: 0, spentSp: 2, stats: { power: 2, defense: 0, luck: 0, speed: 0 } } } });
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Reset points' }));
  expect(g().save.player.spentSp).toBe(2);
  await fireEvent.press(screen.getByRole('button', { name: 'Reset 2 points' }));
  expect(g().save.player.spentSp).toBe(0);
  expect(g().save.player.unspentSp).toBe(2);
});

test('an equipped item that no longer exists shows as Unknown item and can be taken off', async () => {
  const s = g().save;
  useGameStore.setState({ save: { ...s, player: { ...s.player, inventory: [...s.player.inventory, { uid: 'gone', gearId: 'removed-item', obtainedAt: '' }], equipped: { ...s.player.equipped, accessory: 'gone' } } } });
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /Accessory: Unknown item/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Take off' }));
  expect(g().save.player.equipped.accessory).toBeUndefined();
});
