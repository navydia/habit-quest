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

test('the character box shows power, name, title, then class and level', async () => {
  await render(<CharacterScreen />);
  expect(screen.getByLabelText(/^[0-9]+ power$/)).toBeTruthy();
  expect(screen.getByText('Adventurer')).toBeTruthy();
  expect(screen.getByText('the Wanderer')).toBeTruthy();
  expect(screen.getByText('Vanguard · Level 1')).toBeTruthy();
});

test('the cog opens Customize, where name, look and title can change', async () => {
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Customize your character' }));
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Leo');
  await fireEvent.press(screen.getByRole('button', { name: 'Skin deep' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Pointed' }));
  await fireEvent.press(screen.getByRole('button', { name: 'She / her' }));
  const prof = g().save.profile;
  expect(prof.name).toBe('Leo');
  expect(prof.look).toMatchObject({ skin: 'deep', ears: 'pointed' });
  expect(prof.pronouns).toBe('she');
  expect(screen.getByRole('button', { name: /Boss Breaker, locked/ }).props.accessibilityState.disabled).toBe(true);
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

test('a familiar can be made active', async () => {
  useGameStore.setState({ save: { ...g().save, familiars: { owned: ['hoglet', 'bog-toad'], active: 'hoglet' } } });
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /^Familiar: Hoglet/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Bring Bog Toad along' }));
  expect(g().save.familiars.active).toBe('bog-toad');
});

test('an empty name falls back to Adventurer when Customize closes', async () => {
  await render(<CharacterScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Customize your character' }));
  await fireEvent.changeText(screen.getByLabelText('Name'), '   ');
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(g().save.profile.name).toBe('Adventurer');
});

describe('every overlay on the Character tab closes', () => {
  test('Customize closes with Done', async () => {
    await render(<CharacterScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Customize your character' }));
    expect(screen.getByText('Customize')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Customize')).toBeNull();
  });
  test('the slot sheet and familiar sheet close', async () => {
    await render(<CharacterScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Head:/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Leather Cap')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: /^Familiar:/ }));
    expect(screen.getByText(/Beat bosses for a chance/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/Beat bosses for a chance/)).toBeNull();
  });
});
