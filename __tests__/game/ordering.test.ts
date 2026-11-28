import { moveHabit, sortedHabits } from '@/src/game/ordering';
import type { Habit } from '@/src/game/types';
import { habit } from '../helpers/save';

const hs = (): Habit[] => [
  { ...habit('a'), timeOfDay: 'morning', lifeArea: 'health' },
  { ...habit('b'), timeOfDay: 'morning', lifeArea: 'work' },
  { ...habit('c'), timeOfDay: 'evening', lifeArea: 'health' },
];
const ids = (list: Habit[]) => sortedHabits(list).map((h) => h.id);

test('without saved order, habits keep their creation order', () => {
  expect(ids(hs())).toEqual(['a', 'b', 'c']);
});

test('moving within the custom list reorders', () => {
  expect(ids(moveHabit(hs(), 'c', { beforeId: 'a' }))).toEqual(['c', 'a', 'b']);
  expect(ids(moveHabit(hs(), 'a', { beforeId: null }))).toEqual(['b', 'c', 'a']);
});

test('dropping into another time of day changes it immediately', () => {
  const moved = moveHabit(hs(), 'c', { beforeId: 'b', timeOfDay: 'morning' });
  expect(moved.find((h) => h.id === 'c')?.timeOfDay).toBe('morning');
  expect(ids(moved)).toEqual(['a', 'c', 'b']);
});

test('dropping at the end of the Other life area sets it', () => {
  const moved = moveHabit(hs(), 'a', { beforeId: null, lifeArea: 'other' });
  expect(moved.find((h) => h.id === 'a')?.lifeArea).toBe('other');
});

test('an unknown habit leaves the list unchanged', () => {
  const list = hs();
  expect(moveHabit(list, 'zzz', { beforeId: null })).toBe(list);
});
